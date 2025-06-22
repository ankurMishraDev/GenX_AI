import {mutation} from "./_generated/server";
import {v} from "convex/values";

export const syncUser = mutation({
    args:{
        name: v.string(),
        email: v.string(),
        clerkId: v.string(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) =>{
        const userExists = await ctx.db.query("users").filter((q)=> q.eq(q.field("clerkId"), args.clerkId)).first();
        if(userExists) return ;
        return await ctx.db.insert("users", args);
    }
})