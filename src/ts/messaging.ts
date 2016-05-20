/// <reference path="data.ts" />

/* This module is a collection of types and type predicates for processing and sending messages
 * between worker-like objects.
 * 
 * because workers share jsonlike data, code cannot rely on type information to determine behaviour.
 * instead, these interfaces, types, and predicates use structural information to determine what to do.
 */

module manticore.messaging {   
    export interface IMessage<TKey extends string, TPayload> {
        key: TKey;
        payload: TPayload;
    }
   
    export type GenericMessage = IMessage<string, any>;
    
    function message(key: string, payload: any): GenericMessage {
        return { key: key, payload: payload };
    } 
    
    export module dataAccess {
        // messages for accessing party information       
        type PartyGetKeyT = "party.get";   
        const PartyGetKey: PartyGetKeyT = "party.get";    
        type PartyPutKeyT = "party.put";   
        const PartyPutKey: PartyPutKeyT = "party.put"; 
        type PartyDataKeyT = "party.data";
        const PartyDataKey: PartyDataKeyT = "party.data";
        
        export type PartyGet = IMessage<PartyGetKeyT, void>;
        export type PartyPut = IMessage<PartyPutKeyT, data.IParty>;
        export type PartyData = IMessage<PartyDataKeyT, data.IParty>;
        export type PartyMessage = PartyGet | PartyPut | PartyData;      
        
        export function isPartyMessage(msg:IMessage<any, any>): msg is PartyMessage {
            return (msg.key === PartyGetKey || msg.key === PartyPutKey);
        }
        
        export function isPartyGet(msg:PartyMessage): msg is PartyGet {
            return (msg.key === PartyGetKey);
        }
        
        export function isPartyPut(msg:PartyMessage): msg is PartyPut {
            return (msg.key === PartyPutKey);
        }
        
        export function isPartyData(msg:PartyMessage): msg is PartyData {
            return (msg.key === PartyDataKey);
        }
        
        export function partyPutMessage(data: data.IParty): PartyMessage {
            return {key: PartyPutKey, payload: data};
        }
        
        export function partyGetMessage(): PartyMessage {
            return {key:PartyGetKey, payload: undefined};
        }
        
        export function partyDataMessage(data: data.IParty): PartyMessage {
            return {key: PartyDataKey, payload: data};
        }
        
        
        // messages for accessing bestiary data.
        type BestiaryGetKeyT = "bestiary.get";
        const BestiaryGetKey: BestiaryGetKeyT = "bestiary.get";
        
        export type BestiaryGet = IMessage<BestiaryGetKeyT, {getResource: "standard" | "custom" }>;
        
        export type BestiaryMessage = BestiaryGet;
        
        export function isBestiaryMessage(msg:IMessage<any, any>): msg is BestiaryMessage {
            return (msg.key === "Bestiary.Get");
        }
        
        export function isBestiaryGet(msg:BestiaryMessage): msg is BestiaryGet {
            return (msg.key === "Bestiary.Get");
        } 
        
        export function bestiaryGetMessage(resourceName: "standard" | "custom") : BestiaryMessage {
            return { key: BestiaryGetKey, payload: { getResource: resourceName }  };
        }
    }
}