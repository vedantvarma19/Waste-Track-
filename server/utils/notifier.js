// server/utils/notifier.js
const pool = require("../config/db");

let twilioClient = null;

// Initialize Twilio client if credentials exist in environment variables
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("[SMS SYSTEM] Twilio SMS client successfully initialized.");
  } catch (err) {
    console.error("[SMS SYSTEM] Failed to initialize Twilio client:", err.message);
  }
}

exports.sendCitizenNotification = async (complaintId, statusType, details = {}) => {
  try {
    // 1. Fetch complaint and citizen details
    const [rows] = await pool.query(
      "SELECT citizen_name, contact_no, description, location FROM Complaints WHERE complaint_id = ?",
      [complaintId]
    );
    if (rows.length === 0) return;
    const complaint = rows[0];

    // 2. Draft message based on status change
    let message = "";
    switch (statusType) {
      case "Created":
        message = `🌱 [WasteTrack Official] Ticket #${complaintId}: Hello ${complaint.citizen_name}, your complaint about "${complaint.description.substring(0, 30)}..." at ${complaint.location} has been successfully filed.`;
        break;
      case "Assigned":
        message = `🌱 [WasteTrack Official] Ticket #${complaintId} Update: Hello ${complaint.citizen_name}, your complaint has been assigned to employee ${details.employee_name || 'Staff'} with number ${details.employee_phone || 'N/A'}. You can contact him for further details.`;
        break;
      case "Dispatched":
        message = `🌱 [WasteTrack Official] Ticket #${complaintId}: Hello ${complaint.citizen_name}, waste collection vehicle ${details.vehicle_no || 'Truck'} has been dispatched to your location: ${complaint.location}.`;
        break;
      case "Resolved":
        message = `🌱 [WasteTrack] Ticket #${complaintId} Resolved: Hello ${complaint.citizen_name}, your waste complaint is resolved by employee ${details.employee_name || 'Staff'} (ID ${details.employee_id || 'N/A'}). For inquiries contact ${details.employee_phone || 'N/A'}.`;
        break;
      case "Closed":
        message = `🌱 [WasteTrack Official] Ticket #${complaintId}: Hello ${complaint.citizen_name}, your ticket has been reviewed by management and is now officially closed.`;
        break;
      case "Duplicate":
        message = `🌱 [WasteTrack Official] Ticket #${complaintId}: Hello ${complaint.citizen_name}, our AI detected this as a duplicate of active ticket #${details.parent_id} and has merged it to optimize collection runs.`;
        break;
      default:
        message = `🌱 [WasteTrack Official] Ticket #${complaintId}: Hello ${complaint.citizen_name}, your complaint status has been updated.`;
    }

    // 3. Dispatch via Twilio SMS (Real transmission) or simulation mode
    let smsStatus = "Sent";
    
    if (twilioClient && complaint.contact_no && process.env.TWILIO_PHONE_NUMBER) {
      try {
        // Clean and format destination phone number to E.164 (defaults to India prefix +91 if 10 digits)
        let cleanPhone = complaint.contact_no.replace(/\s+/g, "").replace(/[-()]/g, "").trim();
        let formattedPhone = cleanPhone;
        if (!formattedPhone.startsWith("+")) {
          if (formattedPhone.length === 10) {
            formattedPhone = `+91${formattedPhone}`;
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith("0")) {
            formattedPhone = `+91${formattedPhone.substring(1)}`;
          }
        }

        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });

        console.log(`[SMS SYSTEM] Real SMS successfully sent to ${formattedPhone} via Twilio.`);
      } catch (smsError) {
        if (smsError.code === 21608) {
          console.warn(`[SMS SYSTEM] Twilio Trial account restriction: ${formattedPhone} is unverified. Add it in your Twilio Console to test.`);
          smsStatus = "Unverified Number";
        } else {
          console.error(`[SMS SYSTEM] Real SMS failed to send to ${complaint.contact_no}:`, smsError.message);
          smsStatus = "Failed";
        }
      }
    } else {
      console.log(`[SMS SYSTEM] (Simulation Mode) Twilio credentials missing in .env. Logged message: "${message}"`);
    }

    // Log the message status in the database (SMS Channel)
    await pool.query(
      `INSERT INTO Notification_Log (complaint_id, citizen_name, contact_no, channel, recipient_role, message, status) 
       VALUES (?, ?, ?, 'SMS', 'Citizen', ?, ?)`,
      [complaintId, complaint.citizen_name, complaint.contact_no, message, smsStatus]
    );

  } catch (err) {
    console.error("Failed to send notification:", err);
  }
};

exports.sendAdminNotification = async (complaintId, messageText) => {
  try {
    const [rows] = await pool.query(
      "SELECT citizen_name, contact_no FROM Complaints WHERE complaint_id = ?",
      [complaintId]
    );
    const complaint = rows[0] || { citizen_name: "System", contact_no: "System" };

    // Log admin notification (System Push alert)
    await pool.query(
      `INSERT INTO Notification_Log (complaint_id, citizen_name, contact_no, channel, recipient_role, message, status) 
       VALUES (?, ?, ?, 'Push', 'Admin', ?, 'Sent')`,
      [complaintId, complaint.citizen_name, complaint.contact_no, messageText]
    );

    console.log(`[ADMIN NOTIFICATION SYSTEM] "${messageText}"`);
  } catch (err) {
    console.error("Failed to send admin notification:", err);
  }
};
