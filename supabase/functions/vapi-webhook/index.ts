import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VapiWebhookPayload {
  message: {
    type: string;
    call: {
      id: string;
      status: string;
      endedReason?: string;
      transcript?: string;
      recordingUrl?: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VapiWebhookPayload = await req.json();
    const { message } = payload;
    const { call } = message;

    console.log("Received Vapi webhook:", payload);

    // Update welfare call status based on Vapi webhook
    const { data, error } = await supabase
      .from('welfare_calls')
      .update({
        status: call.status === 'ended' ? 'initialized' : call.status,
        call_response: {
          endedReason: call.endedReason,
          transcript: call.transcript,
          recordingUrl: call.recordingUrl,
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('call_id', call.id)
      .select();

    if (error) {
      console.error("Error updating welfare call:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update call status" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Successfully updated welfare call:", data);

    return new Response(
      JSON.stringify({ success: true, updated: data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in Vapi webhook handler:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
