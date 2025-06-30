import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.number(),
              reps: v.number(),
            })
          ),
        })
      ),
    }),
    nutritionPlan: v.object({
      caloriesIntake: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const activePlans = await ctx.db.query("plans")
    .withIndex("byUserId", (q) => q.eq("userId", args.userId))
    .filter((q)=> q.eq(q.field("isActive"), true))
    .collect();

    for(const plan of activePlans){
        await ctx.db.patch(plan._id, { isActive: false });
    }
    
    const planId = await ctx.db.insert("plans", args);
    return planId;
  },
});
