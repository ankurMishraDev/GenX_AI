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
    const {weight, age, height, injuries, fitnessGoals, workoutDays, currentFitnessLevel, dietaryRestrictions, user_id} = payload;
    if (!weight || !age || !height || !injuries || !fitnessGoals || !workoutDays || !currentFitnessLevel || !dietaryRestrictions || !user_id) {
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
        Fitness level: ${currentFitnessLevel}
        
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

    const dietPrompt = `You are an experienced nutrition coach creating a personalized diet plan based on:
        Age: ${age}
        Height: ${height}
        Weight: ${weight}
        Fitness goal: ${fitnessGoals}
        Dietary restrictions: ${dietaryRestrictions}
        
        As a professional nutrition coach:
        - Calculate appropriate daily calorie intake based on the person's stats and goals
        - Create a balanced meal plan with proper macronutrient distribution
        - Include a variety of nutrient-dense foods while respecting dietary restrictions
        - Consider meal timing around workouts for optimal performance and recovery
        
        CRITICAL SCHEMA INSTRUCTIONS:
        - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
        - "dailyCalories" MUST be a NUMBER, not a string
        - DO NOT add fields like "supplements", "macros", "notes", or ANYTHING else
        - ONLY include the EXACT fields shown in the example below
        - Each meal should include ONLY a "name" and "foods" array

        Return a JSON object with this EXACT structure and no other fields:
        {
          "dailyCalories": 2000,
          "meals": [
            {
              "name": "Breakfast",
              "foods": ["Oatmeal with berries", "Greek yogurt", "Black coffee"]
            },
            {
              "name": "Lunch",
              "foods": ["Grilled chicken salad", "Whole grain bread", "Water"]
            }
          ]
        }
        
        DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;

        const dietResult = await aiModel.generateContent(dietPrompt);
        const dietPlanFromAI = dietResult.response.text();

        let dietPlan  =JSON.parse(dietPlanFromAI);
        dietPlan = validateDietPlan(dietPlan);


        // save in db
        const planId = await ctx.runMutation(api.plan.createPlan,{
          userId: user_id,
          nutritionPlan: {
            caloriesIntake: dietPlan.dailyCalories,
            meals: dietPlan.meals,
          },
          isActive:true,
          workoutPlan,
          name: `${fitnessGoals} Program - ${new Date().toLocaleDateString()}`,
        })

        return new Response(JSON.stringify({
          success: true,
          data:{
            planId,
            workoutPlan,
            dietPlan,
          },
        }),{
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
    } catch (error) {
        console.log("Error in creating the program", error)
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ?error.message:"An error occurred while generating the program."
        }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })
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
