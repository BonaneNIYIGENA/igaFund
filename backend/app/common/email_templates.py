"""Email templates for every communication scenario.

Each function returns (subject, body). The actual send happens through
common.mailer.send_email — when SMTP is not configured, the email is
logged to the console, so nothing breaks in development.
"""


def _header():
    return "igaFund — Verified Educational Funding\n" + "=" * 44 + "\n\n"


def _footer():
    return (
        "\n\n---\n"
        "This is an automated message from igaFund.\n"
        "Every contribution is paid directly to the student's school, never to a personal account.\n"
        "Piloting in Rwanda.\n"
    )


def welcome_student(name):
    subject = "Welcome to igaFund — let's get started"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Welcome to igaFund! Your student account has been created.\n\n"
        "Here's what to do next:\n"
        "1. Complete your profile with your academic details\n"
        "2. Upload your verification documents (ID card, transcript)\n"
        "3. Submit your profile for administrative review\n\n"
        "Once approved, donors will be able to find and fund your education.\n"
        "Every contribution goes directly to your school — never to a personal account.\n"
        f"{_footer()}"
    )
    return subject, body


def welcome_donor(name):
    subject = "Welcome to igaFund — thank you for joining"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Welcome to igaFund! Your donor account is ready.\n\n"
        "You can now browse verified student profiles and contribute directly\n"
        "to their school fees. Every payment is routed to the student's registered\n"
        "institution — your donation reaches the school, guaranteed.\n\n"
        "Start browsing: sign in and visit the Browse Students page.\n"
        f"{_footer()}"
    )
    return subject, body


def profile_approved(name, note):
    subject = "Your igaFund profile has been approved!"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Great news — your profile has been verified and approved!\n\n"
        "Donors can now find your profile and contribute to your education.\n"
        "All funding is routed directly to your registered institution.\n\n"
        f"Reviewer's note: {note}\n"
        f"{_footer()}"
    )
    return subject, body


def profile_rejected(name, note):
    subject = "Your igaFund profile needs changes"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Your profile submission has been reviewed, and some changes are needed\n"
        "before it can be approved.\n\n"
        f"Reviewer's note: {note}\n\n"
        "Please sign in, update your profile, and resubmit it for review.\n"
        "If you have questions, reach out through the Help centre.\n"
        f"{_footer()}"
    )
    return subject, body


def funding_received(name, amount, donor_display, institution):
    subject = f"You received {amount:,.0f} RWF in funding!"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        f"{donor_display} has contributed {amount:,.0f} RWF towards your education!\n\n"
        f"This payment has been routed directly to {institution}.\n"
        "You can view your funding progress on your student dashboard.\n"
        f"{_footer()}"
    )
    return subject, body


def contribution_confirmation(name, amount, student_name, institution, receipt_ref):
    subject = f"Your igaFund contribution of {amount:,.0f} RWF"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        f"Thank you for your generous contribution of {amount:,.0f} RWF!\n\n"
        f"Student: {student_name}\n"
        f"Institution: {institution}\n"
        f"Receipt reference: {receipt_ref}\n\n"
        "Your payment has been routed directly to the student's school.\n"
        "You can view your full giving history on your donor dashboard.\n"
        f"{_footer()}"
    )
    return subject, body


def ambassador_promoted(name):
    subject = "You've been promoted to Community Ambassador"
    body = (
        f"{_header()}"
        f"Congratulations {name}!\n\n"
        "You have been promoted to a Community Ambassador role on igaFund.\n\n"
        "As an ambassador, you can now:\n"
        "- Enrol underprivileged students in your community\n"
        "- Help them complete their profiles and upload documents\n"
        "- Submit profiles on behalf of students with limited connectivity\n\n"
        "Thank you for helping bridge the gap between donors and students.\n"
        f"{_footer()}"
    )
    return subject, body


def password_reset(name, token):
    subject = "Reset your igaFund password"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "We received a request to reset your password.\n\n"
        f"Your reset token: {token}\n\n"
        "Copy this token into the password reset page to set a new password.\n"
        "This token expires in 30 minutes.\n\n"
        "If you didn't request this, you can safely ignore this email.\n"
        f"{_footer()}"
    )
    return subject, body


def profile_submitted(name):
    subject = "Your igaFund profile has been submitted for review"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Your profile has been submitted and is now in the review queue.\n\n"
        "An administrator will verify your documents and details.\n"
        "You'll receive a notification once the review is complete.\n\n"
        "In the meantime, make sure all your documents are uploaded\n"
        "and your information is complete.\n"
        f"{_footer()}"
    )
    return subject, body


def change_request_approved(name):
    subject = "Your igaFund profile edit request has been processed"
    body = (
        f"{_header()}"
        f"Hi {name},\n\n"
        "Your request to edit your approved profile has been accepted.\n\n"
        "Your profile has been moved back to pending status.\n"
        "Please make your changes and resubmit for review.\n"
        f"{_footer()}"
    )
    return subject, body
