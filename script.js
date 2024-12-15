document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/films')
        .then(response => response.json())
        .then(data => {
            displayMovieDetails(data[0]); // Display the first movie's details
            displayMoviesList(data); // Display the list of all movies
            setSliderImages(data); // Set up the slider images

            // Store movie data for search
            window.movieData = data;
        });

    // Get modal elements
    const modal = document.getElementById('trailerModal');
    const closeModalBtn = document.querySelector('.modal .close');
    
    // Close modal when 'X' is clicked
    closeModalBtn.onclick = function(event) {
        event.preventDefault(); // Ensure modal close does not cause reload
        closeModal(modal);
    };
    
    // Close modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            event.preventDefault(); // Ensure click outside modal does not cause reload
            closeModal(modal);
        }
    };

    // Set up edit movie dialog
    const editDialog = document.getElementById('editDialog');
    const closeEditDialogBtn = document.querySelector('.close-edit-dialog');
    const movieSearchInput = document.getElementById('movie-search');
    const searchResultsList = document.getElementById('search-results');

    // Open edit dialog when 'Edit Movie' button is clicked
    document.getElementById('edit-movie').onclick = function(event) {
        event.preventDefault(); // Prevent default action
        editDialog.style.display = 'block';
        populateMovieList(window.movieData); // Populate the movie list
    };

    // Close edit dialog when 'X' is clicked
    closeEditDialogBtn.onclick = function() {
        editDialog.style.display = 'none';
    };
    
    // Close edit dialog when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === editDialog) {
            editDialog.style.display = 'none';
        }
    };

    // Filter movie search results as user types
    movieSearchInput.addEventListener('input', () => {
        const query = movieSearchInput.value.toLowerCase();
        searchResultsList.innerHTML = '';

        if (query.length > 0) {
            const filteredMovies = window.movieData.filter(movie => movie.title.toLowerCase().includes(query));
            populateMovieList(filteredMovies);
        } else {
            populateMovieList(window.movieData); // Repopulate full list if search is cleared
        }
    });
});

function populateMovieList(movies) {
    const searchResultsList = document.getElementById('search-results');
    searchResultsList.innerHTML = '';

    movies.forEach(movie => {
        const li = document.createElement('li');
        li.classList.add('search-result-item');

        const img = document.createElement('img');
        img.src = movie.poster;
        img.alt = movie.title;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = movie.title;

        li.appendChild(img);
        li.appendChild(titleSpan);

        li.addEventListener('click', () => {
            openEditModal(movie);
            document.getElementById('editDialog').style.display = 'none';
        });

        searchResultsList.appendChild(li);
    });
}

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
        event.preventDefault(); // Prevent default action
        buyTicket(movie);
    };

    document.getElementById('watch-trailer').onclick = function(event) {
        event.preventDefault(); // Prevent default action
        openModal(movie.trailer);
    };
}

function displayMoviesList(movies) {
    const ul = document.getElementById('films');
    ul.innerHTML = ''; // Clear existing list items

    movies.forEach(movie => {
        const li = document.createElement('li');
        li.classList.add('film', 'item');
        li.dataset.id = movie.id;

        const img = document.createElement('img');
        img.src = movie.poster;
        img.alt = movie.title;

        const titleContainer = document.createElement('div');
        titleContainer.classList.add('title-container');

        const titleSpan = document.createElement('span');
        titleSpan.textContent = movie.title;

        titleContainer.appendChild(titleSpan);
        li.appendChild(img);
        li.appendChild(titleContainer);

        if (movie.capacity - movie.tickets_sold === 0) {
            const soldOutSpan = document.createElement('div');
            soldOutSpan.classList.add('sold-out-text');
            soldOutSpan.textContent = 'Tickets Sold Out';
            titleContainer.appendChild(soldOutSpan); // Append below the title
            li.classList.add('sold-out');
        }

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action
            event.stopPropagation(); // Prevent click event from bubbling up to the li element
            deleteMovie(movie.id, li);
        });

        li.appendChild(deleteButton);

        li.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action
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

        // Update tickets sold on the server
        const updatedTicketsSold = movie.capacity - availableTickets;
        fetch(`http://localhost:3000/films/${movie.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tickets_sold: updatedTicketsSold })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Update successful:', data);
            // Update the UI accordingly
            if (availableTickets === 0) {
                document.getElementById('buy-ticket').disabled = true;
                document.getElementById('buy-ticket').textContent = 'Sold Out';
            }
            updateMovieList(movie.id, availableTickets); // Update the movie list
        })
        .catch(error => console.error('Error:', error));
    } else {
        alert('Tickets are sold out!');
    }
}

function updateMovieList(movieId, availableTickets) {
    const ul = document.getElementById('films');
    const movieItem = Array.from(ul.children).find(li => li.dataset.id === movieId.toString());
    if (movieItem) {
        const titleContainer = movieItem.querySelector('.title-container');
        let soldOutSpan = titleContainer.querySelector('.sold-out-text');

        if (availableTickets === 0) {
            movieItem.classList.add('sold-out');
            if (!soldOutSpan) {
                soldOutSpan = document.createElement('div');
                soldOutSpan.classList.add('sold-out-text');
                soldOutSpan.textContent = 'Tickets Sold Out';
                titleContainer.appendChild(soldOutSpan); // Append below the title
            }
        } else {
            movieItem.classList.remove('sold-out');
            if (soldOutSpan) {
                soldOutSpan.remove();
            }
        }
    }
}


function openEditModal(movie) {
    const modal = document.getElementById('editMovieModal');
    const form = document.getElementById('edit-movie-form');

    document.getElementById('edit-title').value = movie.title;
    document.getElementById('edit-description').value = movie.description;
    document.getElementById('edit-runtime').value = movie.runtime;
    document.getElementById('edit-showtime').value = movie.showtime;
    document.getElementById('edit-capacity').value = movie.capacity;

    modal.style.display = 'block';

    form.onsubmit = function(event) {
        event.preventDefault(); // Prevent form submission
        saveMovieChanges(movie.id);
    };

    document.querySelector('.close-edit').onclick = function() {
        modal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function saveMovieChanges(movieId) {
    const modal = document.getElementById('editMovieModal');
    const title = document.getElementById('edit-title').value;
    const description = document.getElementById('edit-description').value;
    const runtime = parseInt(document.getElementById('edit-runtime').value);
    const showtime = document.getElementById('edit-showtime').value;
    const capacity = parseInt(document.getElementById('edit-capacity').value);

    fetch(`http://localhost:3000/films/${movieId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, runtime, showtime, capacity })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Movie updated successfully:', data);
        modal.style.display = 'none';
        fetch('http://localhost:3000/films')
            .then(response => response.json())
            .then(data => {
                displayMoviesList(data); // Refresh the list of all movies
                displayMovieDetails(data.find(movie => movie.id === movieId)); // Refresh the movie details
            });
    })
    .catch(error => console.error('Error updating movie:', error));
}

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

function deleteMovie(movieId, listItem) {
    fetch(`http://localhost:3000/films/${movieId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            listItem.remove();
            console.log(`Movie with ID ${movieId} deleted successfully.`);
        } else {
            console.error('Error deleting movie:', response.statusText);
        }
    })
    .catch(error => console.error('Error:', error));
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
