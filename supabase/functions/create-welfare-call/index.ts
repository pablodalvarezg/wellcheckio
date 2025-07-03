/// <reference types="https://deno.land/x/types/deno.ns.d.ts" />

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VapiCallRequest {
  welfareCallId: string;
  phoneNumber: string;
  serviceUserName: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    const vapiAssistantId = Deno.env.get("VAPI_ASSISTANT_ID");
    
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      hasVapiKey: !!vapiApiKey,
      hasVapiAssistant: !!vapiAssistantId
    });

    if (!vapiApiKey || !vapiAssistantId) {
      console.error("Missing Vapi credentials");
      return new Response(
        JSON.stringify({ error: "Vapi credentials not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { welfareCallId, phoneNumber, serviceUserName, message }: VapiCallRequest = await req.json();

    console.log("Creating welfare call:", { welfareCallId, phoneNumber, serviceUserName });

    // Make the call to Vapi
    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: vapiAssistantId,
        customer: {
          number: phoneNumber,
          name: serviceUserName,
        },
        assistantOverrides: {
          firstMessage: `Hello ${serviceUserName}, ${message}`,
        },
      }),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi API error:", vapiResponse.status, errorText);
      
      // Update welfare call status to failed
      await supabase
        .from('welfare_calls')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', welfareCallId);

      return new Response(
        JSON.stringify({ error: `Vapi API error: ${vapiResponse.status} - ${errorText}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const vapiData = await vapiResponse.json();
    console.log("Vapi call response:", vapiData);

    // Update the welfare call with the Vapi call ID and status
    const { data: updatedCall, error: updateError } = await supabase
      .from('welfare_calls')
      .update({
        status: 'in-progress',
        call_id: vapiData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', welfareCallId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating welfare call:", updateError);
      throw updateError;
    }

    console.log("Welfare call updated successfully:", updatedCall);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: vapiData.id,
        welfareCall: updatedCall 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in create-welfare-call handler:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
