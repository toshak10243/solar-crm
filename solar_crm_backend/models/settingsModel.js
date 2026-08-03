const { db } = require("../config/db");

// ======================================
// Get Settings
// ======================================

const getSettings = async () => {

    const [rows] = await db.query(`

        SELECT *

        FROM settings

        LIMIT 1

    `);

    return rows;

};

// ======================================
// Update Settings
// ======================================

const updateSettings = async (data) => {

    const {

        company_name,
        company_email,
        company_phone,
        website,

        gst_number,
        pan_number,

        address,
        city,
        state,
        country,
        pincode,

        currency,
        timezone,
        date_format,

        smtp_host,
        smtp_port,
        smtp_username,
        smtp_password,
        smtp_encryption,

        session_timeout,
        password_expiry_days,
        otp_length,

        enable_2fa,
        strong_password,

        email_notifications,
        lead_notifications,
        weekly_reports,
        system_notifications,

        backup_frequency,
        backup_retention_days

    } = data;

    const [result] = await db.query(

        `

        UPDATE settings

        SET

        company_name=?,
        company_email=?,
        company_phone=?,
        website=?,

        gst_number=?,
        pan_number=?,

        address=?,
        city=?,
        state=?,
        country=?,
        pincode=?,

        currency=?,
        timezone=?,
        date_format=?,

        smtp_host=?,
        smtp_port=?,
        smtp_username=?,
        smtp_password=?,
        smtp_encryption=?,

        session_timeout=?,
        password_expiry_days=?,
        otp_length=?,

        enable_2fa=?,
        strong_password=?,

        email_notifications=?,
        lead_notifications=?,
        weekly_reports=?,
        system_notifications=?,

        backup_frequency=?,
        backup_retention_days=?

        WHERE id=1

        `,

        [

            company_name,
            company_email,
            company_phone,
            website,

            gst_number,
            pan_number,

            address,
            city,
            state,
            country,
            pincode,

            currency,
            timezone,
            date_format,

            smtp_host,
            smtp_port,
            smtp_username,
            smtp_password,
            smtp_encryption,

            session_timeout,
            password_expiry_days,
            otp_length,

            enable_2fa,
            strong_password,

            email_notifications,
            lead_notifications,
            weekly_reports,
            system_notifications,

            backup_frequency,
            backup_retention_days

        ]

    );

    return result;

};

// ======================================
// Update Company Logo
// ======================================

const updateCompanyLogo = async (logo) => {

    const [result] = await db.query(

        `

        UPDATE settings

        SET company_logo=?

        WHERE id=1

        `,

        [logo]

    );

    return result;

};

module.exports = {

    getSettings,
    updateSettings,
    updateCompanyLogo

};