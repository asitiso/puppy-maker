import {STORY_EVENTS,type StoryEventId} from '../../game/events';

export type StoryChoiceAction={type:'EVENT_CHOICE';eventId:StoryEventId;choiceId:string};

export function commitStoryChoice(eventId:StoryEventId,choiceId:string,dispatch:(action:StoryChoiceAction)=>void):boolean{
  const event=STORY_EVENTS.find(item=>item.id===eventId);
  if(!event||!event.choices.some(choice=>choice.id===choiceId))return false;
  dispatch({type:'EVENT_CHOICE',eventId,choiceId});
  return true;
}
