# Auth

Stock Laravel UI scaffold with a few QuickManage-specific touches.

- **Scaffold**: `Auth::routes(['verify' => true])` in [routes/web.php](../../routes/web.php) generates login / register / logout / password reset / email verify routes.
- **Controllers**: [app/Http/Controllers/Auth/](../../app/Http/Controllers/Auth/) — `LoginController`, `RegisterController`, `ForgotPasswordController`, `ResetPasswordController`, `ConfirmPasswordController`, `VerificationController`, plus the custom `LogoutAGOLController`.
- **User model**: [app/Models/User.php](../../app/Models/User.php)
- **Views**: [resources/views/auth/](../../resources/views/auth/) + mail template [auth/passwords/mail-templates/reset-password-mail.blade.php](../../resources/views/auth/passwords/mail-templates/reset-password-mail.blade.php)

## Login / register

- `LoginController::$redirectTo = '/dashboard'`.
- `RegisterController` generates `uniqid = Str::uuid()` for every new user and validates `password|confirmed|min:8`.
- `ResetPasswordController::$redirectTo = '/dashboard'`.
- `VerificationController::$redirectTo = '/home'` (stock; note `/home` is **not** a registered route — verification lands on 404 until someone fixes this).

## Password reset

[User::sendPasswordResetNotification](../../app/Models/User.php) overrides the default notifier to dispatch [app/Mail/PasswordResetMail.php](../../app/Mail/PasswordResetMail.php):

```php
Mail::to($this->email)->send(new PasswordResetMail(route('password.reset', [
    'token' => $token,
    'email' => $this->email,
])));
```

Subject: "Reset Your Password". View: `auth.passwords.mail-templates.reset-password-mail`.

## ArcGIS logout

[LogoutAGOLController@logout](../../app/Http/Controllers/Auth/LogoutAGOLController.php) is separate from the normal Laravel logout. It clears:

- `arcgis.access_token`
- `arcgis.expires_in`
- `arcgis.username`

…invalidates the session and regenerates the CSRF token, then redirects `/`.

Use this from the AI module; use the stock `POST /logout` for full app logout.

## User identifier

`User` has a `uniqid` column written on registration. It is used by [ProfileController](../../app/Http/Controllers/ProfileController.php) for inline ownership checks (`Auth::user()->uniqid !== $uniqid → 403`). ⚠️ This column is **not** present in the committed migration — see [../known-issues.md#missing-migrations](../known-issues.md#missing-migrations).
