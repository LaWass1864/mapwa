exports.handler = async (event) => {
  const snack = JSON.parse(event.body);

  if (!snack.name || !snack.mood) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing name or mood' })
    };
  }

  // Ici tu peux logguer ou stocker le snack dans une base plus tard
  console.log('Snack reçu via Background Sync :', snack);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Snack bien reçu !' })
  };
};
