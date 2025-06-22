import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        image: v.optional(v.string()),
        clerkId: v.string(),        
    }).index("byClerkId", ["clerkId"]),

    plans:defineTable({
        userId: v.id("users"),
        name: v.string(),
        workoutPlan: v.object({
            schedule: v.array(v.string()),
            exercises: v.array(v.object({
                day: v.string(),
                routines: v.array(v.object({
                    name: v.string(),
                    sets: v.optional(v.number()),
                    reps: v.optional(v.number()),
                    duration: v.optional(v.number()),
                    description: v.optional(v.string()),
                    exercises: v.optional(v.array(v.string())),
                }))
            }))
        }),

        nutritionPlan: v.object({
            caloriesIntake: v.number(),
            meals: v.array(v.object({
                name: v.string(),
                foods: v.array(v.string()),
            }))
        }),
        isActive: v.boolean(),
    }).index("byUserId", ["userId"]).index("byActive", ["isActive"]),
});