import fs from 'fs';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { load } from '../json_manager.js';
import log from './logger.js';

const secrets = load('secrets');

export default async function speechToText() {
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = sdk.SpeechConfig.fromSubscription(secrets.speechKey, secrets.speechRegion);
    speechConfig.speechRecognitionLanguage = "en-US";

    let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync("./output.wav"));
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    return new Promise((resolve) => {
        speechRecognizer.recognizeOnceAsync(result => {
            let text = "";
            switch (result.reason) {
                case sdk.ResultReason.RecognizedSpeech:
                    log(`RECOGNIZED: ${result.text}`);
                    text = result.text;
                    break;
                case sdk.ResultReason.NoMatch:
                    log("NOMATCH: Speech could not be recognized.");
                    break;
                case sdk.ResultReason.Canceled:
                    const cancellation = sdk.CancellationDetails.fromResult(result);
                    log(`CANCELED: ${cancellation.reason}`);

                    if (cancellation.reason == sdk.CancellationReason.Error) {
                        log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                        log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
                        log("CANCELED: Did you set the speech resource key and region values?");
                    }
                    break;
            }
            speechRecognizer.close();
            resolve(text);
        });
    });
}