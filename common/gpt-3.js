import { Configuration, OpenAIApi } from "openai";
import { load } from '../json_manager.js';

const config = load('config');
const configuration = new Configuration({
    apiKey: config.apiKey,
});
const openai = new OpenAIApi(configuration);

export default async function getAIResponse(prompt) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 1,
        max_tokens: 128
    });

    return completion.data.choices[0].text;;
}