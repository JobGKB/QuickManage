<div class="message_block">
    <div class="offset-lg-2 col-lg-9">
        @if ($message = Session::get('success'))
            <div id="successMessage" class="successMessage alert alert-success alert-block pt-3 text-center">
                <strong>{{ $message }}</strong>
            </div>
        @endif

        @if ($errors->any())
            @foreach ($errors->all() as $error)
                <div class="alert alert-danger alert-block pt-3 text-center">
                    <strong>{{ $error }}</strong>
                </div>
            @endforeach
        @endif
    </div>
</div>
