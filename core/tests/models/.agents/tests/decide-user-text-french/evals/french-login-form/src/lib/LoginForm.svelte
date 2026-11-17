<script lang="ts">
	let email = '';
	let password = '';
</script>

<form method="post">
	<h2>Connexion</h2>
	<label for="email">Adresse e-mail</label>
	<input id="email" type="email" bind:value={email} placeholder="vous@exemple.fr" />
	<label for="password">Mot de passe</label>
	<input id="password" type="password" bind:value={password} />
	<a href="/reset">Mot de passe oublié ?</a>
	<button type="submit">Se connecter</button>
</form>
