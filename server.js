const http = require('http');
const fs = require('fs');
const url = require('url');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const serveFile = (res, filePath, contentType) => {
	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(500);
			res.end();
			return;
		}

		res.writeHead(200, { 'Content-Type': contentType });
		res.end(data);
	});
};

const getResponseType = (req) => {
	const accept = req.headers.accept;

	if (accept && accept.includes('text/xml')) {
		return 'xml';
	}

	return 'json';
};

const respondJSON = (res, status, message, id) => {
	const response = id ? { message, id } : { message };

	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(response));
};

const respondXML = (res, status, message, id) => {
	let response = `<response><message>${message}</message>`;

	if (id) {
		response += `<id>${id}</id>`;
	}

	response += '</response>';

	res.writeHead(status, { 'Content-Type': 'text/xml' });
	res.end(response);
};

const handleAPI = (req, res, pathname, query) => {
	const type = getResponseType(req);
	const send = type === 'xml' ? respondXML : respondJSON;

	if (pathname === '/success') {
		send(res, 200, 'This is a successful response');
		return;
	}

	if (pathname === '/badRequest') {
		if (!query.valid) {
			send(res, 400, 'Missing valid query parameter set to true', 'badRequest');
		} else {
			send(res, 200, 'This request has the required parameters');
		}
		return;
	}

	if (pathname === '/unauthorized') {
		if (!query.loggedIn) {
			send(res, 401, 'Missing loggedIn query parameter set to yes', 'unauthorized');
		} else {
			send(res, 200, 'You have successfully viewed the content.');
		}
		return;
	}

	if (pathname === '/forbidden') {
		send(res, 403, 'You do not have access to this content.', 'forbidden');
		return;
	}

	if (pathname === '/internal') {
		send(res, 500, 'Internal Server Error. Something went wrong.', 'internalError');
		return;
	}

	if (pathname === '/notImplemented') {
		send(
			res,
			501,
			'A get request for this page has not been implemented yet. Check again later for updated content.',
			'notImplemented'
		);
		return;
	}

	send(res, 404, 'The page you are looking for was not found.', 'notFound');
};

const onRequest = (req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const pathname = parsedUrl.pathname;

	if (pathname === '/') {
		serveFile(res, './client/client.html', 'text/html');
		return;
	}

	if (pathname === '/style.css') {
		serveFile(res, './client/style.css', 'text/css');
		return;
	}

	handleAPI(req, res, pathname, parsedUrl.query);
};

http.createServer(onRequest).listen(port);
