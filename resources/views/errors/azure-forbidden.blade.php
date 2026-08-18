@extends('errors.errors-layout')

@section('code',__('403'))

@section('title',__('Geen toegang'))

@section('badge',__('Toegang geweigerd'))

@section('message')
    @if(!empty($email))
        Het account <strong>{{ $email }}</strong> mag deze pagina niet gebruiken.<br><br>
    @else
        Dit account mag deze pagina niet gebruiken.<br><br>
    @endif
    Alleen accounts met een <strong>@{{ $allowedDomain ?? 'gkbgroep.nl' }}</strong> e-mailadres hebben toegang.
@endsection

@section('button')
    <form method="POST" action="{{ route('azure.logout') }}" style="display:inline">
        @csrf
        <button type="submit" class="btn">Afmelden en opnieuw proberen</button>
    </form>
@endsection

@section('footer',__('Neem contact op met de systeembeheerder als je denkt dat dit onterecht is.'))
