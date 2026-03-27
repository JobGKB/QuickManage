console.log('Category JS loaded');
$(document).ready(function () {
    initCategoryNameEditing();
    initDescriptionEditing();
    initAppSelection();
});

function initCategoryNameEditing() {
    var originalName = '';

    function startEditing() {
        var nameSpan = $('#categoryName');
        if ($('#categoryInput').length) return;
        originalName = nameSpan.text();

        nameSpan.html('<input type="text" id="categoryInput" class="category_change_input d-inline-block" value="' + $('<div>').text(originalName).html() + '">');

        $('#editIcon').hide();
        $('#saveIcon, #cancelIcon').show();
    }

    function saveName() {
        var newName = $('#categoryInput').val().trim();
        if (!newName) return;

        var categoryId = $('#categoryTitle').data('uniqid');

        $.ajax({
            url: '/manage/app-gallery/category/update/' + categoryId,
            type: 'PATCH',
            data: {
                category_name: newName,
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                $('#categoryName').text(response.category_name);
                $('#saveIcon, #cancelIcon').hide();
                $('#editIcon').show();
            },
            error: function () {
                alert('Er ging iets mis bij het opslaan.');
            }
        });
    }

    $('#editIcon').on('click', startEditing);
    $('#categoryName').on('click', startEditing);

    $('#cancelIcon').on('click', function () {
        $('#categoryName').text(originalName);
        $('#saveIcon, #cancelIcon').hide();
        $('#editIcon').show();
    });

    $(document).on('keydown', '#categoryInput', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveName();
        }
    });

    $(document).on('click', function (e) {
        if (!$('#categoryInput').length) return;
        if ($(e.target).closest('.header-container').length) return;
        saveName();
    });

    $('#saveIcon').on('click', saveName);
}

function initDescriptionEditing() {
    var originalDescription = '';

    function startEditingDescription() {
        var descSpan = $('#description-container');
        if ($('#descriptionInput').length) return;
        originalDescription = descSpan.text();

        descSpan.html('<textarea id="descriptionInput" class="description_change_textarea" rows="4">' + $('<div>').text(originalDescription).html() + '</textarea>');

        $('#descEditIcon').hide();
        $('#descSaveIcon, #descCancelIcon').show();
    }

    function saveDescription() {
        var newDescription = $('#descriptionInput').val().trim();
        var categoryId = $('#categoryTitle').data('uniqid');
        
        $.ajax({
            url: '/manage/app-gallery/category/update/' + categoryId,
            type: 'PATCH',
            data: {
                description: newDescription,
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                $('#description-container').text(response.description || '');
                $('#descSaveIcon, #descCancelIcon').hide();
                $('#descEditIcon').show();
            },
            error: function () {
                alert('Er ging iets mis bij het opslaan.');
            }
        });
    }

    $('#descEditIcon').on('click', startEditingDescription);
    $('#description-container').on('click', function (e) {
        if (e.target.id !== 'descriptionInput') {
            startEditingDescription();
        }
    });

    $('#descCancelIcon').on('click', function () {
        $('#description-container').text(originalDescription);
        $('#descSaveIcon, #descCancelIcon').hide();
        $('#descEditIcon').show();
    });

    $(document).on('keydown', '#descriptionInput', function (e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            $('#descCancelIcon').trigger('click');
        }
    });

    $(document).on('click', function (e) {
        if (!$('#descriptionInput').length) return;
        if ($(e.target).closest('.description-container').length) return;
        saveDescription();
    });

    $('#descSaveIcon').on('click', saveDescription);
}

function initAppSelection() {
    // Toggle select/deselect on app badge click
    $('.appSelectionContainer').on('click', '.app-badge', function () {
        var badge = $(this);

        if (badge.hasClass('selected')) {
            badge.removeClass('selected').addClass('deselected');
             
        } else {
            badge.removeClass('deselected').addClass('selected');
            
        }
    });

    // Search/filter apps
    $('#appSearchInput').on('keyup', function () {
        var searchValue = $(this).val().toLowerCase();
        $('.appSelectionContainer .app-badge').each(function () {
            var appName = $(this).find('span:last').text().toLowerCase();
            $(this).closest('.col-lg-4').toggle(appName.indexOf(searchValue) > -1);
        });
    });

    // Save selected apps on update button click
    $('#update_appBTN').on('click', function () {
        var categoryId = $('#categoryTitle').data('uniqid');
        var selectedAppIds = [];
        var selectedCustomAppIds = [];

        $('.appSelectionContainer .app-badge.selected').each(function () {
            selectedAppIds.push($(this).data('app-id'));
            selectedCustomAppIds.push($(this).data('custom-app-id'));
        });

        $.ajax({
            url: '/manage/app-gallery/category/update-apps/' + categoryId,
            type: 'POST',
            data: {
                app_ids: selectedAppIds,
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function () {
                location.reload();
            },
            error: function () {
                alert('Er ging iets mis bij het opslaan van de apps.');
            }
        });

        $.ajax({
            url: '/manage/app-gallery/category/update-custom-apps/' + categoryId,
            type: 'POST',
            data: {
                custom_app_ids: selectedCustomAppIds,
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function () {
                location.reload();
            },
            error: function () {
                alert('Er ging iets mis bij het opslaan van de apps.');
            }
        });
    });
}