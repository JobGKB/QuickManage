<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
    <h1>Hello ya boi!</h1>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    
    <a href="{{ $url }}" style="background-color: #3490dc; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
    </a>

    <p>This password reset link will expire in {{ config('auth.passwords.' . config('auth.defaults.passwords') . '.expire') }} minutes.</p>
    <p>If you did not request a password reset, no further action is required.</p>

    <p>Regards,<br>{{ config('app.name') }}</p>
</body>
</html>