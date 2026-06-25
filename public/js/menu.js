 
function closeMenu() {
    console.log('close');
    var menu = document.getElementsByClassName('menu');
    var ham_menu = document.getElementsByClassName('ham_menu');
    
    for (var i = 0; i < menu.length; i++) {
      menu[i].style.display = "none";
 
    }
    
    for (var i = 0; i < ham_menu.length; i++) {
      ham_menu[i].style.display = "block";
 
    }
  }

  function openMenu() {
    console.log('open');
   
    var menu = document.getElementsByClassName('menu');
    var ham_menu = document.getElementsByClassName('ham_menu');
    
    for (var i = 0; i < menu.length; i++) {
      menu[i].style.display = "block";
       
    }
    
    for (var i = 0; i < ham_menu.length; i++) {
      ham_menu[i].style.display = "none";
 
    }
  }

  function toggleUserInfoModal() {
    var modal = document.getElementById('userInfoModal');
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    var modal = document.getElementById('userInfoModal');
    var toggleBtn = document.querySelector('.user-image');
    if (modal.style.display === "block" && 
        !modal.contains(event.target) && 
        !toggleBtn.contains(event.target)) {
        modal.style.display = "none";
    }
});