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

    // Asegurarse de que el número de teléfono tenga el formato correcto
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Remover espacios y caracteres especiales del número
    const cleanPhone = formattedPhone.replace(/\s+/g, '').replace(/[-()]/g, '');

    console.log("Creating welfare call:", { 
      welfareCallId, 
      phoneNumber: cleanPhone,
      serviceUserName,
      assistantId: vapiAssistantId
    });

    const requestBody = {
      assistantId: vapiAssistantId,
      customer: {
        phoneNumber: cleanPhone,  // Usar el número limpio aquí
        name: serviceUserName,
      },
      firstMessage: `Hello ${serviceUserName}, ${message}`,
    };

    console.log("Vapi request body:", JSON.stringify(requestBody, null, 2));

    // Make the call to Vapi
    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Capturar el texto completo de la respuesta antes de procesarla
    const responseText = await vapiResponse.text();
    console.log("Raw Vapi response:", responseText);

    let vapiData;
    try {
      vapiData = JSON.parse(responseText);
      console.log("Parsed Vapi response:", vapiData);
    } catch (e) {
      console.error("Failed to parse Vapi response:", responseText);
      throw new Error(`Invalid JSON response from Vapi: ${responseText}`);
    }

    if (!vapiResponse.ok) {
      console.error("Vapi API error:", {
        status: vapiResponse.status,
        response: responseText,
        requestBody
      });
      
      // Update welfare call status to failed
      await supabase
        .from('welfare_calls')
        .update({
          status: 'failed',
          error_details: `Vapi API error: ${vapiResponse.status} - ${responseText}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', welfareCallId);

      return new Response(
        JSON.stringify({ 
          error: "Failed to initiate call with Vapi",
          details: responseText,
          requestSent: requestBody
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Vapi call created successfully:", vapiData);

    // Update the welfare call with the Vapi call ID and status
    const { data: updatedCall, error: updateError } = await supabase
      .from('welfare_calls')
      .update({
        status: 'in-progress',
        call_id: vapiData.id,
        provider_data: vapiData, // Guardamos toda la respuesta de Vapi para referencia
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
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
