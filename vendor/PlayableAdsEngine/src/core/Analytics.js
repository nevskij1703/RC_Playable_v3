import { uuidv4 } from "../utils";

export default class Analytics {
  constructor(options) {
    this.sessionId = uuidv4();

    this.path = options.path;
    this.appId = options.appId;
    this.apiKey = options.apiKey;

    this.playableId = `${PLAYABLE_TITLE}${PLAYABLE_NUMBER}`;
    this.platform = window.applicationSettings.adNetwork;
  }

  send(options) {
    if (window.applicationSettings.analytics) {
      const { path, appId, apiKey } = this;
      const { eventName } = options;
      const id = uuidv4(),
        playableVersion = `${window.application.version}`,
        time = new Date().toISOString(); //"2024-01-12T09:52:44.248Z";

      const requestData = {
        appId: appId,
        apiKey: apiKey,
        events: [
          {
            id: id,
            eventName,
            version: 1,
            sessionId: this.sessionId,
            userId: this.sessionId,
            isUserIdDirty: true,
            userIdRevision: 1,
            clientEventTime: time,
            clientUploadTime: time,
            eventProperties: {
              /* additionalProp1: "string",
            additionalProp2: "string",
            additionalProp3: "string", */
            },
            userProperties: {
              playable_id: this.playableId,
              playable_version: playableVersion,
              device_platform: this.platform,
            },
          },
        ],
      };

      //console.log(JSON.stringify(requestData));

      fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(requestData),
      });
      /*       .then((response) => response.json())
      .then((data) => {
        console.log(data);
      }); */
    }
  }
}
