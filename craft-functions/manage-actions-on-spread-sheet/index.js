import { JSDOM } from "jsdom";
import api from "api";
const sdk = api('@dev-karte/v0.0.1#<% SDK_SUFFIX %>');
const LOG_LEVEL = '<% LOG_LEVEL %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});
  logger.debug(data.jsonPayload.data.hook_data.body);

  const {<% API_TOKEN_SECRET_KEY %>: api_token} = await secret.get({keys: ['<% API_TOKEN_SECRET_KEY %>']})
  sdk.auth(api_token);
  const {
      campaign_id,
      action_id,
      image_url
  } = data.jsonPayload.data.hook_data.body;
  const { data: campaign } = await sdk.postV2betaActionCampaignFindbyid({
    id: campaign_id,
  });

  // campaign.actionsはaction_idしか保持していないため、contentなどの実体を取得する
  const actions = await Promise.all(campaign.actions.map(async (action)=>{
    const { data: actionObj } = await sdk.postV2alphaActionActionFindbyid({
      action_id: action.action_id
    });
    return actionObj;
  }));
  const action = actions.find(action=>action.shorten_id === action_id);
  if(!action)throw new Error('action not found');
  
  const dom = new JSDOM(action.content.html);
  const document = dom.window.document;

  const imgElement = document.querySelector('#<% IMAGE_ELEMENT_ID %>');
  imgElement.src = image_url; 
  const updatedHtmlString = document.querySelector('.<% ACTION_WRAPPER_CLASS_NAME %>').outerHTML;

  const { data: result } = await sdk.postV2alphaActionActionUpdate({
      action_id: action.id,
      query: {
        content: {
          ...action.content,
          html: updatedHtmlString,
          source_html: updatedHtmlString,
        }
      },
    });
  if(!result.success) throw new Error('Update failed');
}
