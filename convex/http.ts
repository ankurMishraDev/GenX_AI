import { httpRouter } from "convex/server";
import {WebhookEvent} from "@clerk/nextjs/server";
import {Webhook} from "svix";
import {api} from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    path:"/clerkWebhook",
    method:"POST",
    handler: httpAction(async (ctx, req)=>{
        const webhookKey = process.env.Clerk_Webhook;
        if(!webhookKey){
            throw new Error("Clerk Webhook key is missing");
        }
        const svix_id = req.headers.get("svix-id");
        const svix_signature = req.headers.get("svix-signature");
        const svix_timestamp = req.headers.get("svix-timestamp");

        if(!svix_id || !svix_signature || !svix_timestamp){
            return new Response("Missing svix headers", {status: 400})
        }
        const payload = await req.json();
        const body = JSON.stringify(payload);
        const wbh = new Webhook(webhookKey);
        let event: WebhookEvent;
        try {
            event = wbh.verify(body,{
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent
        } catch (error) {
            console.log("Error in verfiying webhook:", error);
            return new Response("Invalid webhook signature", {status: 400});
        }
        const eventType = event.type;
        if(eventType === "user.created"){
            const {id, first_name, last_name, image_url, email_addresses} = event.data;
            const email = email_addresses[0].email_address;
            const name = `${first_name||""} ${last_name||""}`.trim();
            try {
                await ctx.runMutation(api.users.syncUser, {
                    email,
                    name,
                    image: image_url,
                    clerkId: id,
                })
            } catch (error) {
                console.log("Error in creating user at mutation:", error);
                return new Response("Error in creating user", {status: 500});
            }
        }
        return new Response("Webhooks connected successfully",{status:200});
    })
})
export default http;