console.log('Custom App Create JS loaded');

$(document).ready(function () {
    initCustomAppCreation();
});

function initCustomAppCreation() {
    $('#update_appBTN').on('click', function () {
        var form = $('.create-form-custom-app')[0];
        
        // Validate required fields
        var name = $('input[name="name"]').val().trim();
        var url = $('input[name="url"]').val().trim();
        
        if (!name) {
            alert('Voer alstublieft een app naam in.');
            return;
        }
        
        if (!url) {
            alert('Voer alstublieft een app URL in.');
            return;
        }
        
        // Create FormData to handle file upload
        var formData = new FormData(form);
        
        $.ajax({
            url: '/manage/custom-apps/store',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                // Close the modal
                $('#createCustomApp').modal('hide');
                
                // Reset the form
                form.reset();
                
                // Show success message and reload
                var successHtml = '<div id="successMessage" class="successMessage alert alert-success alert-block pt-3 text-center"><strong>Custom app succesvol aangemaakt!</strong></div>';
                
                // Insert success message at the top
                $('.message_block .offset-lg-2.col-lg-9').html(successHtml);
                
                // Auto-hide success message after 3 seconds and reload
                setTimeout(function () {
                    location.reload();
                }, 2000);
            },
            error: function (error) {
                console.error('Error creating custom app:', error);
                
                if (error.responseJSON && error.responseJSON.errors) {
                    var errorMessages = error.responseJSON.errors;
                    var errorHtml = '';
                    
                    $.each(errorMessages, function (field, messages) {
                        $.each(messages, function (index, message) {
                            errorHtml += '<div class="alert alert-danger alert-block pt-3 text-center"><strong>' + message + '</strong></div>';
                        });
                    });
                    
                    $('.message_block .offset-lg-2.col-lg-9').html(errorHtml);
                } else {
                    alert('Er ging iets mis bij het aanmaken van de app.');
                }
            }
        });
    });
}
