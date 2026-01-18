import { SmsTemplate } from '../models/index.js'

// Default templates to seed if not exists
const DEFAULT_TEMPLATES = [
    {
        key: 'otp_login',
        name: 'Login OTP',
        description: 'OTP code sent during login',
        content: 'Your OTP is {otp}. Valid for 5 minutes. - {app_name}',
        variables: ['otp', 'app_name'],
    },
    {
        key: 'account_approved',
        name: 'Account Approved',
        description: 'Sent when admin approves a user registration',
        content: 'Hi {user_name}, your account has been approved! You can now log in to {app_name}.',
        variables: ['user_name', 'app_name'],
    },
    {
        key: 'account_rejected',
        name: 'Account Rejected',
        description: 'Sent when admin rejects a user registration',
        content: 'Hi {user_name}, your registration has been declined. Reason: {reason}',
        variables: ['user_name', 'reason'],
    },
    {
        key: 'account_pending',
        name: 'Account Pending',
        description: 'Sent when account is moved back to pending status',
        content: 'Hi {user_name}, your account status has been changed to pending review.',
        variables: ['user_name'],
    },
    {
        key: 'post_approved',
        name: 'Post Published',
        description: 'Sent when admin approves and publishes a post',
        content: 'Hi {user_name}, your post "{post_title}" has been approved and published!',
        variables: ['user_name', 'post_title'],
    },
    {
        key: 'post_rejected',
        name: 'Post Rejected',
        description: 'Sent when admin rejects a post',
        content: 'Hi {user_name}, your post was not approved. Reason: {reason}',
        variables: ['user_name', 'reason'],
    },
    {
        key: 'event_reminder',
        name: 'Event Reminder',
        description: 'Reminder sent before an upcoming event',
        content: 'Reminder: {event_name} is on {event_date}!',
        variables: ['event_name', 'event_date'],
    },
    {
        key: 'welcome',
        name: 'Welcome Message',
        description: 'Sent after first successful login',
        content: 'Welcome to {app_name}, {user_name}! We are glad to have you.',
        variables: ['user_name', 'app_name'],
    },
]

export const smsService = {
    /**
     * Seed default templates if they don't exist
     */
    async seedDefaultTemplates(): Promise<void> {
        for (const template of DEFAULT_TEMPLATES) {
            const existing = await SmsTemplate.findOne({ where: { key: template.key } })
            if (!existing) {
                await SmsTemplate.create(template)
                console.log(`📝 Created SMS template: ${template.key}`)
            }
        }
    },

    /**
     * Get all templates
     */
    async getAllTemplates(): Promise<SmsTemplate[]> {
        return SmsTemplate.findAll({ order: [['name', 'ASC']] })
    },

    /**
     * Get a template by key
     */
    async getTemplate(key: string): Promise<SmsTemplate | null> {
        return SmsTemplate.findOne({ where: { key } })
    },

    /**
     * Update a template's content
     */
    async updateTemplate(key: string, content: string): Promise<SmsTemplate | null> {
        const template = await SmsTemplate.findOne({ where: { key } })
        if (!template) return null
        await template.update({ content })
        return template
    },

    /**
     * Toggle template active status
     */
    async toggleTemplate(key: string): Promise<SmsTemplate | null> {
        const template = await SmsTemplate.findOne({ where: { key } })
        if (!template) return null
        await template.update({ isActive: !template.isActive })
        return template
    },

    /**
     * Render a template with variables replaced
     */
    async renderTemplate(key: string, variables: Record<string, string>): Promise<string | null> {
        const template = await SmsTemplate.findOne({ where: { key, isActive: true } })
        if (!template) return null

        let content = template.content
        for (const [varName, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`\\{${varName}\\}`, 'g'), value)
        }
        return content
    },

    /**
     * Send SMS (placeholder - integrate with actual SMS provider)
     */
    async sendSms(mobileNumber: string, message: string): Promise<boolean> {
        // TODO: Integrate with SMS provider (Twilio, MSG91, etc.)
        console.log(`📱 SMS to ${mobileNumber}: ${message}`)
        return true
    },

    /**
     * Send templated SMS - high-level method
     */
    async sendTemplatedSms(
        mobileNumber: string,
        templateKey: string,
        variables: Record<string, string>
    ): Promise<boolean> {
        const message = await this.renderTemplate(templateKey, variables)
        if (!message) {
            console.warn(`SMS template '${templateKey}' not found or inactive`)
            return false
        }
        return this.sendSms(mobileNumber, message)
    },
}

export default smsService
