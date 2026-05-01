@extends('layouts.app')

@section('content')

<div class="login-wrapper"> 
    
    <div class="login-container">
        
        <img src="{{ asset('storage/logo-cm.png') }}">

        <form method="POST" action="{{ route('login') }}">
                @csrf
                <div class="input-form-wr">

                    <div><label for="email"  >{{ __('E-mailadres') }}</label></div>
                    <div><input   id="email" type="email" class=" @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email" autofocus></div>
                 
                    @error('email')
                        <span class="invalid-feedback" role="alert">
                            <strong>{{ $message }}</strong>
                        </span>
                    @enderror
                 
                    <div><label for="password" > {{ __('Wachtwoord') }}</label></div>  
                    <div><input id="password" type="password" class=" @error('password') is-invalid @enderror" name="password" required autocomplete="current-password"></div>

                    @error('password')
                        <span class="invalid-feedback" role="alert">
                            <strong>{{ $message }}</strong>
                        </span>
                    @enderror

                    <div>
                            <button type="submit" >
                                {{ __('Inloggen') }}
                            </button>
                        @if (Route::has('password.request'))
                        
                            <a class=" " href="{{ route('password.request') }}">
                                {{ __('Wachtwoord vergeten?') }}
                            </a> 
                    
                        @endif  
                        {{-- @if (Route::has('password.request'))
                        
                            <a class=" " href="{{ route('register') }}">
                                {{ __('Registreren?') }}
                            </a>
                    
                        @endif   --}}
                           <br/> <a href="/testAI" class="ai-btn">Test AI met AGOL</a> 
                    </div>
               
                </div>    
        </form>
            @if ($errors->any())
            @foreach ($errors->all() as $error)
                <div class="alert alert-danger alert-block pt-3">
                    <strong>{{ $error }}</strong>
                </div>
            @endforeach
            @endif
    </div>
</div>
    
@endsection
