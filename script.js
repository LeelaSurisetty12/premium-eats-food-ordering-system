let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Custom Toast Notification
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) return alert(message); // fallback

    let toast = document.createElement("div");
    toast.className = "toast glass-panel";
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92FE9D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

// LOGIN
async function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (!user || !pass) {
        return showToast("Please enter both username and password!");
    }

    let params = new URLSearchParams();
    params.append("username", user);
    params.append("password", pass);

    try {
        let response = await fetch("LoginServlet", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
        
        let result = await response.text();
        console.log("Server responded with:", result);

        if (result.trim() === "SUCCESS") {
            let oldUser = localStorage.getItem("user");
            if (oldUser && oldUser !== user) {
                localStorage.removeItem("cart");
            }
            localStorage.setItem("user", user);
            showToast("Login Successful! Redirecting...");
            setTimeout(() => { window.location.href = "dashboard.html"; }, 1000);
        } else if (result.trim() === "FAILED") {
            showToast("Invalid Username or Password");
        } else if (result.trim() === "ERROR") {
            showToast("Database Error (Check Tomcat logs)!");
        } else {
            showToast("Server Error: " + result.substring(0,40));
        }
    } catch (error) {
        console.error(error);
        showToast("Server error! Is Tomcat running?");
    }
}

// REGISTER
async function register() {
    let user = document.getElementById("reg-username").value;
    let pass = document.getElementById("reg-password").value;

    if (!user || !pass) return showToast("Please fill all fields!");

    let params = new URLSearchParams();
    params.append("username", user);
    params.append("password", pass);

    try {
        let response = await fetch("RegisterServlet", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
        
        let result = await response.text();
        if (result.trim() === "SUCCESS") {
            showToast("Account Created! Redirecting to login...");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
        } else {
            showToast(result);
        }
    } catch (e) {
        showToast("Server error!");
    }
}

// SIMULATED GOOGLE LOGIN
function googleLogin() {
    showToast("Authenticating with Google...");
    setTimeout(() => {
        let oldUser = localStorage.getItem("user");
        if (oldUser && oldUser !== "GoogleCustomer") {
            localStorage.removeItem("cart");
        }
        localStorage.setItem("user", "GoogleCustomer");
        showToast("Google Login Success! Redirecting...");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 1000);
    }, 1500);
}

// WELCOME MESSAGE
if (document.getElementById("welcomeMsg")) {
    let user = localStorage.getItem("user") || "Guest";
    document.getElementById("welcomeMsg").innerText = "Welcome, " + user + " 🎉";
}

// ADD TO CART
function addToCart(name, price) {
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    showToast(name + " added to cart!");
}

// SHOW CART
function renderCart() {
    let list = document.getElementById("cartList");
    if (!list) return;
    
    let total = 0;
    list.innerHTML = "";

    cart.forEach((item, index) => {
        if (!item.quantity) item.quantity = 1; // Backwards compatibility
        
        let li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "15px";
        
        let span = document.createElement("span");
        span.innerText = item.name + " - ₹" + item.price;
        
        let controls = document.createElement("div");
        controls.style.display = "flex";
        controls.style.alignItems = "center";
        controls.style.gap = "12px";

        let minusBtn = document.createElement("button");
        minusBtn.innerText = "-";
        minusBtn.style.padding = "4px 10px";
        minusBtn.style.width = "auto";
        minusBtn.style.margin = "0";
        minusBtn.onclick = () => updateQuantity(index, -1);

        let qtySpan = document.createElement("span");
        qtySpan.innerText = item.quantity;
        qtySpan.style.fontWeight = "bold";

        let plusBtn = document.createElement("button");
        plusBtn.innerText = "+";
        plusBtn.style.padding = "4px 10px";
        plusBtn.style.width = "auto";
        plusBtn.style.margin = "0";
        plusBtn.onclick = () => updateQuantity(index, 1);

        let delBtn = document.createElement("button");
        delBtn.innerHTML = "❌";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.cursor = "pointer";
        delBtn.style.padding = "4px";
        delBtn.style.width = "auto";
        delBtn.style.margin = "0";
        delBtn.style.fontSize = "16px";
        delBtn.onclick = () => {
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        };

        controls.appendChild(minusBtn);
        controls.appendChild(qtySpan);
        controls.appendChild(plusBtn);
        controls.appendChild(delBtn);

        li.appendChild(span);
        li.appendChild(controls);
        list.appendChild(li);
        
        total += item.price * item.quantity;
    });

    document.getElementById("total").innerText = "Total: ₹" + total;
}

function updateQuantity(index, delta) {
    if (cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
    } else {
        cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

renderCart();

// PLACE ORDER CONFIRMATION
function placeOrder() {
    if (cart.length === 0) {
        return showToast("Your cart is empty!");
    }

    let summaryDiv = document.getElementById("modalSummary");
    summaryDiv.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        let p = document.createElement("p");
        p.innerText = `${item.quantity}x ${item.name} = ₹${item.price * item.quantity}`;
        p.style.marginBottom = "8px";
        summaryDiv.appendChild(p);
        total += item.price * item.quantity;
    });

    document.getElementById("modalTotal").innerText = "Grand Total: ₹" + total;
    document.getElementById("confirmModal").style.display = "flex";
}

// ACTUAL SUBMISSION TO SERVER
async function submitOrderConfirmed() {
    document.getElementById("confirmModal").style.display = "none";
    showToast("Processing Order...");

    try {
        for (let item of cart) {
            let params = new URLSearchParams();
            params.append('item', item.name);
            params.append('price', item.price);
            params.append('quantity', item.quantity || 1);
            params.append('username', localStorage.getItem('user') || 'Guest');

            let response = await fetch('OrderServlet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            if (!response.ok) {
                return showToast("Error processing order. Is the server running?");
            }
        }
        
        showToast("Order Placed Successfully! 🎉 Redirecting...");
        localStorage.removeItem("cart");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);

    } catch (error) {
        console.error("Network error: ", error);
        showToast("Connection error: Is Tomcat running?");
    }
}

// SEARCH FOOD
function searchFood() {
    let filter = document.getElementById("searchInput").value.toLowerCase();
    let cards = document.querySelectorAll(".menu .card");

    cards.forEach(card => {
        let title = card.querySelector("h2").innerText.toLowerCase();
        if (title.indexOf(filter) > -1) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}
