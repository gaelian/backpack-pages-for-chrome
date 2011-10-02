function getItem(key)
{
	var item;

	try
	{
		item = window.localStorage.getItem(key);
	}
	catch(e)
	{
		console.log('Error getting local storage item: ' + e);
		item = null;
	}
	
	return item;
}

function setItem(key, value)
{
	try
	{
		window.localStorage.removeItem(key);
		window.localStorage.setItem(key, value);
	}
	catch(e)
	{
		console.log('Error setting local storage item: ' + e);
		return false;
	}
	
	return true;
}

function removeItem(key)
{
	window.localStorage.removeItem(key);
}