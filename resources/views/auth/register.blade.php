@extends('layouts.app')

@section('content')
<div class="login-wrapper"> 
    <div class="login-container">
    @if ($errors->any())
            @foreach ($errors->all() as $error)
                <div class="alert alert-danger alert-block pt-3 text-center">
                    <strong>{{ $error }}</strong>
                </div>
            @endforeach
            @endif
        <img src="{{ asset('storage/logo-cm.png') }}">
                    <form method="POST" action="{{ route('register') }}">
                        @csrf
                        <div class="input-form-wr">

                            <div><label for="name">{{ __('Naam') }}</label></div>
                            <div><input id="name" type="text" class="@error('name') is-invalid @enderror" name="name" value="{{ old('name') }}" required autocomplete="name" autofocus></div>
                            @error('name')
                                <span class="invalid-feedback" role="alert">
                                    <strong>{{ $message }}</strong>
                                </span>
                            @enderror
                        
                             

                            <div><label for="email" >{{ __('E-mailadres') }}</label></div>
                            <div><input id="email" type="email" class="@error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email"></div>
                                @error('email')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror

                            <div><label for="password" >{{ __('Wachtwoord') }}</label></div>
                            <div><input id="password" type="password" class=" @error('password') is-invalid @enderror" name="password" required autocomplete="new-password"></div>
                                @error('password')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror

                            <div><label for="password-confirm">{{ __('Bevestig wachtwoord') }}</label></div>
                            <div><input id="password-confirm" type="password" name="password_confirmation" required autocomplete="new-password"></div>

                            <div>
                            @if (Route::has('password.request'))
                                <a class="btn btn-link" href="{{ route('login') }}">
                                    {{ __('Inloggen?') }}
                                </a>
                            @endif  

                                <button type="submit">
                                    {{ __('Registreren') }}
                                </button>
                            </div>

                        </div>
                    </form>
    </div>
</div>
      
@endsection
