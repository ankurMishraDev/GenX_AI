import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import {GoogleGenerativeAI} from "@google/generative-ai";
const http = httpRouter();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
http.route({
  path: "/clerkWebhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const webhookKey = process.env.Clerk_Webhook;
    if (!webhookKey) {
      throw new Error("Clerk Webhook key is missing");
    }
    const svix_id = req.headers.get("svix-id");
    const svix_signature = req.headers.get("svix-signature");
    const svix_timestamp = req.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Missing svix headers", { status: 400 });
    }
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wbh = new Webhook(webhookKey);
    let event: WebhookEvent;
    try {
      event = wbh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (error) {
      console.log("Error in verfiying webhook:", error);
      return new Response("Invalid webhook signature", { status: 400 });
    }
    const eventType = event.type;
    if (eventType === "user.created") {
      const { id, first_name, last_name, image_url, email_addresses } =
        event.data;
      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();
      try {
        await ctx.runMutation(api.users.syncUser, {
          email,
          name,
          image: image_url,
          clerkId: id,
        });
      } catch (error) {
        console.log("Error in creating user at mutation:", error);
        return new Response("Error in creating user", { status: 500 });
      }
    }
    return new Response("Webhooks connected successfully", { status: 200 });
  }),
});

http.route({
  path: "/vapi/generate-program",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
        const payload = await req.json();
    const {weight, age, height, injuries, fitnessGoals, workoutDays, currentFinessLevel, dietaryRestrictions, user_id} = payload;
    if (!weight || !age || !height || !injuries || !fitnessGoals || !workoutDays || !currentFinessLevel || !dietaryRestrictions || !user_id) {
      return new Response("Missing required fields", { status: 400 });
    }
    const aiModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig:{
            temperature: 0.5,
            topP: 0.95,
            responseMimeType: "application/json",
        }
    })

    const workoutPrompt = `You are an experienced fitness coach creating a personalized workout plan based on:
        Age: ${age}
        Height: ${height}
        Weight: ${weight}
        Injuries or limitations: ${injuries}
        Available days for workout: ${workoutDays}
        Fitness goal: ${fitnessGoals}
        Fitness level: ${currentFinessLevel}
        
        As a professional coach:
        - Consider muscle group splits to avoid overtraining the same muscles on consecutive days
        - Design exercises that match the fitness level and account for any injuries
        - Structure the workouts to specifically target the user's fitness goal
        
        CRITICAL SCHEMA INSTRUCTIONS:
        - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
        - "sets" and "reps" MUST ALWAYS be NUMBERS, never strings
        - For example: "sets": 3, "reps": 10
        - Do NOT use text like "reps": "As many as possible" or "reps": "To failure"
        - Instead use specific numbers like "reps": 12 or "reps": 15
        - For cardio, use "sets": 1, "reps": 1 or another appropriate number
        - NEVER include strings for numerical fields
        - NEVER add extra fields not shown in the example below
        
        Return a JSON object with this EXACT structure:
        {
          "schedule": ["Monday", "Wednesday", "Friday"],
          "exercises": [
            {
              "day": "Monday",
              "routines": [
                {
                  "name": "Exercise Name",
                  "sets": 3,
                  "reps": 10
                }
              ]
            }
          ]
        }
        
        DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;
        const workoutResult = await aiModel.generateContent(workoutPrompt);
        const workoutPlanFromAI= workoutResult.response.text();

        let workoutPlan= JSON.parse(workoutPlanFromAI);
        workoutPlan = validateWorkoutPlan(workoutPlan);
    } catch (error) {
        console.log("Error in creating the program")
    }
    
  }),
});

// validate and fix workout plan to ensure it has proper numeric types
function validateWorkoutPlan(plan: any) {
  const validatedPlan = {
    schedule: plan.schedule,
    exercises: plan.exercises.map((exercise: any) => ({
      day: exercise.day,
      routines: exercise.routines.map((routine: any) => ({
        name: routine.name,
        sets: typeof routine.sets === "number" ? routine.sets : parseInt(routine.sets) || 1,
        reps: typeof routine.reps === "number" ? routine.reps : parseInt(routine.reps) || 10,
      })),
    })),
  };
  return validatedPlan;
}

// validate diet plan to ensure it strictly follows schema
function validateDietPlan(plan: any) {
  // only keep the fields we want
  const validatedPlan = {
    dailyCalories: plan.dailyCalories,
    meals: plan.meals.map((meal: any) => ({
      name: meal.name,
      foods: meal.foods,
    })),
  };
  return validatedPlan;
}
export default http;
