import pkg from "@msg91comm/sendotp-sdk";
const { OTPWidget } = pkg;

const widgetId = process.env.MSG91_WIDGET_ID;
const authToken = process.env.MSG91_AUTH_TOKEN;

OTPWidget.initializeWidget(widgetId, authToken);

export default OTPWidget;
