export function referenceErrorMessage(code?:string) {
  switch(code) {
    case 'signin_required': return 'Your session has expired. Sign in again to prepare this reference.';
    case 'rate_limited': case 'ai_rate_limited': return 'Too many learning requests are running right now. Wait a minute, then try again.';
    case 'ai_mode_off': return 'AI Mode is off, so this question was answered from your own notes only. Turn AI Mode on in the sidebar for a generated answer.';
    case 'ai_unavailable': case 'setup_required': return 'Reference generation is not configured. The administrator needs to check the AI model and service configuration.';
    case 'ai_provider_unavailable': return 'The AI provider could not accept this request. The administrator needs to check provider credentials, model access, and available credits.';
    case 'reference_timeout': return 'Preparing this reference took too long. Please try again with a fresh request.';
    case 'invalid_origin': return 'The request origin could not be verified. Reload this application and try again.';
    case 'network_error': return 'The learning service could not be reached. Check your connection and try again.';
    default: return 'This reference could not be prepared because the learning service returned an incomplete response. Please try again.';
  }
}
