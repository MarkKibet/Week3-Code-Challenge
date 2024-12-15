document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/films')
        .then(response => response.json())
        .then(data => {
            displayMovieDetails(data[0]); // Display the first movie's details
            displayMoviesList(data); // Display the list of all movies
            setSliderImages(data); // Set up the slider images
            
        });

    // Get modal elements
    const modal = document.getElementById('trailerModal');
    const closeModalBtn = document.querySelector('.modal .close');
    
    // Close modal when 'X' is clicked
    closeModalBtn.onclick = function() {
        closeModal(modal);
    };
    
    // Close modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal(modal);
        }
    };
});

function displayMovieDetails(movie) {
    document.getElementById('poster').src = movie.poster;
    document.getElementById('title').textContent = movie.title;
    document.getElementById('description').textContent = movie.description;
    document.getElementById('runtime').textContent = movie.runtime;
    document.getElementById('showtime').textContent = movie.showtime;
    document.getElementById('available-tickets').textContent = movie.capacity - movie.tickets_sold;

    if (movie.capacity - movie.tickets_sold === 0) {
        document.getElementById('buy-ticket').disabled = true;
        document.getElementById('buy-ticket').textContent = 'Sold Out';
    } else {
        document.getElementById('buy-ticket').disabled = false;
        document.getElementById('buy-ticket').textContent = 'Buy Ticket';
    }

    document.getElementById('buy-ticket').onclick = function(event) {
        event.preventDefault(); 
        buyTicket(movie);
    };

    document.getElementById('watch-trailer').onclick = function() {
        openModal(movie.trailer);
    };
}

function displayMoviesList(movies) {
    const ul = document.getElementById('films');
    ul.innerHTML = ''; // Clear existing list items

    movies.forEach(movie => {
        const li = document.createElement('li');
        li.classList.add('film', 'item');

        const img = document.createElement('img');
        img.src = movie.poster;
        img.alt = movie.title;

        const span = document.createElement('span');
        span.textContent = movie.title;

        li.appendChild(img);
        li.appendChild(span);

        li.addEventListener('click', () => {
            fetch(`http://localhost:3000/films/${movie.id}`)
                .then(response => response.json())
                .then(data => displayMovieDetails(data));
        });

        ul.appendChild(li);
    });
}

function buyTicket(movie) {
    const availableTicketsElement = document.getElementById('available-tickets');
    let availableTickets = parseInt(availableTicketsElement.textContent);
    if (availableTickets > 0) {
        availableTickets -= 1;
        availableTicketsElement.textContent = availableTickets;
        if (availableTickets === 0) {
            document.getElementById('buy-ticket').disabled = true;
            document.getElementById('buy-ticket').textContent = 'Sold Out';
        }
    } else {
        alert('Tickets are sold out!');
    }
}
//creating a slider 
function setSliderImages(movies) {
    const slider = document.querySelector('.slider');
    slider.innerHTML = ''; 

    
    movies.forEach(movie => {
        const img = document.createElement('img');
        img.src = movie.poster;
        img.alt = movie.title;
        slider.appendChild(img);
    });

       
}



function openModal(trailerLink) {
    const modal = document.getElementById('trailerModal');
    const trailerIframe = document.getElementById('trailer');
    trailerIframe.src = trailerLink;
    modal.style.display = 'block';
}

function closeModal(modal) {
    const trailerIframe = document.getElementById('trailer');
    trailerIframe.src = ''; // Stop the video
    modal.style.display = 'none';
}
