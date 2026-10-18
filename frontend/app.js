
const API_URL = "https://recipe-manager-crud-4.onrender.com/api/recipes";

const form = document.getElementById("recipe-form");
const recipeList = document.getElementById("recipe-list");

let editingId = null;


// READ: Display all recipes
async function loadRecipes() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load recipes.");
        }

        const recipes = await response.json();

        console.log("Recipes received from database:", recipes);

        recipeList.innerHTML = "";

        recipes.forEach(recipe => {
            const row = document.createElement("tr");

            const prepTime = recipe.prep_time ?? recipe.prepTime;

            const values = [
                recipe.id,
                recipe.title,
                recipe.ingredients,
                prepTime === null || prepTime === undefined || prepTime === ""
                    ? "-"
                    : `${prepTime} minutes`,
                recipe.category ?? recipe.difficulty ?? "-"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.type = "button";
            editButton.onclick = () => editRecipe(recipe);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.type = "button";
            deleteButton.onclick = () => deleteRecipe(recipe.id);

            actions.append(editButton, deleteButton);
            row.appendChild(actions);

            recipeList.appendChild(row);
        });

    } catch (error) {
        console.error("Loading error:", error);
        alert("Could not load recipes. Check that your backend is running.");
    }
}


// CREATE AND UPDATE: Save recipe details
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const ingredients = document.getElementById("ingredients").value.trim();
    const prepTimeValue = document.getElementById("prepTime").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!title || !ingredients || !prepTimeValue || !difficulty) {
        alert("Please fill in all fields.");
        return;
    }

    const prepTime = Number(prepTimeValue);

    if (!Number.isFinite(prepTime) || prepTime < 1) {
        alert("Preparation time must be at least 1 minute.");
        return;
    }

    const recipe = {
        title: title,
        ingredients: ingredients,
        instructions: ingredients,
        category: difficulty,
        prepTime: prepTime,
        prep_time: prepTime
    };

    console.log("Sending recipe to backend:", recipe);

    try {
        const url = editingId
            ? `${API_URL}/${editingId}`
            : API_URL;

        const response = await fetch(url, {
            method: editingId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(recipe)
        });

        const result = await response.json();

        console.log("Backend save response:", result);

        if (!response.ok) {
            throw new Error(result.error || "Could not save recipe.");
        }

        alert(result.message || "Recipe saved successfully!");

        form.reset();
        editingId = null;

        form.querySelector("button[type='submit']").textContent =
            "Create Record";

        await loadRecipes();

    } catch (error) {
        console.error("Saving error:", error);
        alert(error.message);
    }
});


// UPDATE: Load selected recipe into the form
function editRecipe(recipe) {
    editingId = recipe.id;

    document.getElementById("title").value = recipe.title;
    document.getElementById("ingredients").value = recipe.ingredients;

    document.getElementById("prepTime").value =
        recipe.prep_time ?? recipe.prepTime ?? "";

    document.getElementById("difficulty").value =
        recipe.category ?? recipe.difficulty ?? "";

    form.querySelector("button[type='submit']").textContent =
        "Update Record";

    form.scrollIntoView({ behavior: "smooth" });
}


// DELETE: Remove a recipe
async function deleteRecipe(id) {
    if (!confirm("Are you sure you want to delete this recipe?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not delete recipe.");
        }

        alert(result.message || "Recipe deleted successfully!");

        await loadRecipes();

    } catch (error) {
        console.error("Deleting error:", error);
        alert(error.message);
    }
}


// Load recipes when the website opens
loadRecipes();
