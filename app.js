const express = require("express");
const k8s = require("@kubernetes/client-node");
const axios = require("axios");
const fs = require("fs");
const logger = require('./logger');



const webAocDeploymentName = process.env.WEB_AOC_DEPLOYMENT_NAME;
const webAocNamespaceName = process.env.WEB_AOC_NAMESPACE_NAME;
const webAocPort = process.env.WEB_AOC_PORT;
const modelsToUpdateOnStartup =
  process.env.MODELS_TO_UPDATE_ON_STARTUP?.split(",") || [];

// Express
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());

// K8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// Read the ServiceAccount token
//let token;
//try {
//  token = fs.readFileSync(
//    "/var/run/secrets/kubernetes.io/serviceaccount/token",
//    "utf8"
//  );
//} catch (error) {
//  logger.error("Couldn't read service account token. Exiting.");
//  process.exit(1);
//}

async function getPods(namespaceName, deploymentName) {
  try {
    const response = await k8sApi.listNamespacedPod(
      namespaceName,
      undefined,
      undefined,
      undefined,
      undefined,
      `app=${deploymentName}`,
      undefined,
      undefined,
      undefined,
      undefined,
      /*{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }*/
    );
    return response.body.items;
  } catch (error) {
    logger.error("Error fetching pods:", error);
    return [];
  }
}

async function notifyPodWithRetry(url, pod, requestBody) {
  const MAX_RETRIES = 3;
  const TIMEOUT = 10000; // 10 seconds in milliseconds
  const DELAY_BETWEEN_RETRIES = 1000; // 1 second delay between retries

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Calling API on Pod with URL: ${url}`);
      const response = await axios.post(url, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: TIMEOUT,
      });

      logger.info(`Response from ${pod.metadata.name}:`, response.data);
      break; // Success, exit retry loop
    } catch (error) {
      logger.error(
        `Attempt ${attempt} failed for ${pod.metadata.name}:`,
        error.message
      );
      if (attempt === MAX_RETRIES) {
        console.error(`All retry attempts failed for ${pod.metadata.name}`);
      } else {
        logger.info(`Retrying in ${DELAY_BETWEEN_RETRIES / 1000} seconds...`);
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_RETRIES)
        );
      }
    }
  }
}

async function triggerRevalidationOfNextCacheOnPod(pods, port, requestBody) {
  const notificationPromises = [];
  for (const pod of pods) {
    const podIP = pod.status.podIP;
    const url = `http://${podIP}:${port}/api/revalidate?secret=${process.env.STRAPI_WEBHOOK_TOKEN}`;
    notificationPromises.push(notifyPodWithRetry(url, pod, requestBody));
  }
  await Promise.allSettled(notificationPromises);
}

// Middleware to check the secret key
const checkSecretKey = (req, res, next) => {
  const secretKey = req.headers["secret"];
  if (secretKey !== process.env.STRAPI_WEBHOOK_TOKEN) {
    return res.status(401).send("Unauthorized: Invalid secret key");
  }
  next();
};

async function notifyPods(req) {
  const pods = await getPods(webAocNamespaceName, webAocDeploymentName);

  if (pods.length === 0) {
    logger.info(
      `No pods found in namespace: ${webAocNamespaceName} for deployment ${webAocDeploymentName}`
    );
    return;
  }

  logger.info(
    `Found ${pods.length} pods for deployment ${webAocDeploymentName} in namespace: ${webAocNamespaceName}`
  );
  await triggerRevalidationOfNextCacheOnPod(pods, webAocPort, req.body);
}

app.post("/webhook", checkSecretKey, async (req, res) => {
  const strapiEvent = req.headers["x-strapi-event"];

  if (
    strapiEvent === undefined ||
    (strapiEvent !== "entry.create" &&
      strapiEvent !== "entry.update" &&
      strapiEvent !== "entry.delete" &&
      strapiEvent !== "entry.publish" &&
      strapiEvent !== "entry.unpublish")
  ) {
    logger.info(`Received strapi event: '${strapiEvent}'. Skipping.`);
    res.status(200).send("Webhook received");
    return;
  }

  const model = req.body["model"];

  if (model === undefined) {
    logger.info("Received malformed event from strapi");
    res.status(500).send("Malformed webhook from strapi received.");
    return;
  }

  logger.info(`Received strapi event: '${strapiEvent}' with model: ${model}`);
  await notifyPods(req);

  res.status(200).send("Success");
});

app.listen(port, async () => {
  logger.info("notifying pods on startup");
  for (const model of modelsToUpdateOnStartup) {
    logger.info(`cache invalidation request for model=${model}`);
    await notifyPods({
      body: {
        model,
      },
    });
  }
  logger.info("done notifying pods on startup");

  logger.info(`Server running on port ${port}`);
});
