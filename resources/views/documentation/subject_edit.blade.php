@extends('layouts.app')

@section('content')
    @include('includes.menu')
    @include('documentation._messages')

    <div class="container-fluid doc-manage">
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="breadcrumbs">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/manage/documentation">Documentatie</a></li>
                            <li class="breadcrumb-item active" aria-current="page">{{ $subject->name }}</li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Onderwerp bewerken</h2>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="edit-form doc-form">
                        <form action="/manage/documentation/subject/update/{{ $subject->uniqid }}" method="POST">
                            @csrf
                            @method('PATCH')

                            <label for="name" class="c-bold">Naam van het onderwerp:</label>
                            <input type="text" id="name" name="name" value="{{ old('name', $subject->name) }}" maxlength="100" required>

                            <label for="sort_order" class="c-bold pt-3">Volgorde:</label>
                            <input type="number" id="sort_order" name="sort_order" value="{{ old('sort_order', $subject->sort_order) }}" min="0" max="9999">
                            <p class="doc-hint">Onderwerpen met een lager getal staan hoger in het menu van de documentatie.</p>

                            <input type="submit" name="submit" value="Opslaan">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
