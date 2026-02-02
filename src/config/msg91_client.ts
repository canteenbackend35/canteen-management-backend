import * as sdk from "@msg91comm/sendotp-sdk";

// The SDK is poorly packaged and may be wrapped incorrectly by different tools
// We check multiple locations for the OTPWidget class
const OTPWidget: any = (sdk as any).OTPWidget || (sdk as any).default?.OTPWidget || sdk;

const widgetId = process.env.MSG91_WIDGET_ID;
const authToken = process.env.MSG91_AUTH_TOKEN;

if (OTPWidget && typeof OTPWidget.initializeWidget === 'function') {
  OTPWidget.initializeWidget(widgetId, authToken);
} else {
  console.error("🔥 Failed to initialize MSG91 OTPWidget: Class not found in SDK bundle.");
}

export default OTPWidget;
