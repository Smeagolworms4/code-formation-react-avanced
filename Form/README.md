# Les forms.

Ici on retrouvera une version react qui s'utilise avec use form et vue sur avec un new Form.
Biensur cela est dans un ecosysteme de form qui gère des rules. Et il faudra l'adapter au besoin 


 - React :


```

export default function() {

	const [ toto, setToto ] = useState('');
	const form = useForm({
		handle: async () => {
			await form.call(async () => {
				// ENVOIE DES DONNÉES
			});
			
		},
		fields: {
			toto: {
				value: toto,
				onInput: (event) => setToto(event.target.value);
				name: "toto",
				rules: [ () => !!v || 'value requiese' ]
			}
		}
	});

	return (
		<form onSubmit="form.handle">
			<AfficheLesErreurGeneral form={form} />
			<TextField {...form.fields.toto} />
		</form>
	)
}

```

 - Vue :
 ```html
<form @submit="form.handle()">
	<AfficheLesErreurGeneral :form='form' />
	<TextField
		v-model="toto"
		name="toto"
		:rules="form.rules('toto', [ () => !!v || 'value requiese' ])"
	/>
</form>
 ```
 ```typscript
 
 
 export default {
 	
 	date() {
 		toto: '',
 		form: null,
 	},
 	
 	mounted() {
 		this.form = new Form(this); // Decouper le form de linit pour eviter les probleme severside en nuxt
 	}
 };
 
 ```