document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('stream-form').style.display = 'block';
    }

    // Fetch the current title
    await fetchCurrentTitle();
});
