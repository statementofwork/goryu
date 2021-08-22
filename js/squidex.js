const CONFIG = {
    url: 'https://cloud.squidex.io',
    appName: 'goryu',
    clientId: 'goryu:default',
    clientSecret: 'fyxv1z5lwxbnnc04pzrg9h7kvifg4kpc6jtn9qm0ab8x'
};

function getBearerToken() {
    return localStorage.getItem('token');
}

function setBearerToken(token) {
    localStorage.setItem('token', token);
}

function clearBearerToken() {
    localStorage.removeItem('token');
}

async function getPage(slug) {
    const json = await getContent(`api/content/${CONFIG.appName}/page/?$filter=data/slug/iv eq '${slug}'`);
    const { items } = json;
    if (items.length === 0) {
        return null;
    }
    return parseContentItem(items[0]);
}

async function getNewsItem(slug) {
    const json = await getContent(`api/content/${CONFIG.appName}/news/?$filter=data/slug/iv eq '${slug}'`);
    const { items } = json;
    if (items.length === 0) {
        return null;
    }
    return parseContentItem(items[0]);
}

async function getNews() {
    const json = await getContent(`api/content/${CONFIG.appName}/news/?$orderby=data/Date/iv desc`);
    const { total, items } = json;
    if (items.length === 0) {
        return null;
    }
    return { total, newsItems: items.map(x => parseContentItem(x))};
}

async function getHpTeasers() {
    const json = await getContent(`api/content/${CONFIG.appName}/news/?$filter=data/isTeaser/iv eq true`);
    const { total, items } = json;
    if (items.length === 0) {
        return null;
    }
    return { total, teaserItems: items.map(x => parseContentItem(x))};
}

async function getTopNavigations() {
    const json2 = await getContent(`api/content/${CONFIG.appName}/topnavigation/?$orderby=data/OrderBy/iv asc`);
    const { total, items } = json2;
    if (items.length === 0) {
        return null;
    }
    return { total, navs: items.map(x => parseNavigation(x))};
}

function parseContentItem(response) {
    return {
        id: response.id,
        slug: response.data.slug,
        banner: response.data.Banner,
        title: response.data.Title,
        teaser: response.data.Teaser,
        richText: response.data.RichText,
        date: response.data.Date,
    };
}

function parseNavigation(response) {
    return {
        id: response.id,
        title: response.data.Title,
        link: response.data.Link,
    };
}


async function fetchBearerToken() {
    // Check if we have already a bearer token in local store.
    let token = getBearerToken();
    if (token) {
        return token;
    }
    const body = `grant_type=client_credentials&scope=squidex-api&client_id=${CONFIG.clientId}&client_secret=${CONFIG.clientSecret}`;

    // Get the bearer token. Ensure that we use a client id with readonly permissions.
    const response = await fetch(buildUrl('identity-server/connect/token'), { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body 
    });
    if (!response.ok) {
        throw new Error(`Failed to retrieve token, got ${response.statusText}`);
    }
    const json = await response.json();
    token = json.access_token;
    // Cache the bearer token in the local store.
    setBearerToken(token);

    return token;
}

function getContent(url) {
    return getContentInternal(url, true);
}

async function getContentInternal(url, retry) {
    // Fetch the bearer token.
    const token = await fetchBearerToken();
    const response = await fetch(buildUrl(url), {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });     
    if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
            // If we get an error we clear the bearer token and retry the request.
            clearBearerToken();
            if (retry) {
                return getContentInternal(url);
            }
        }
        throw new Error(`Failed to retrieve content, got ${response.statusText}`);
    }
    return await response.json();
}

function buildUrl(url) {
    if (url.length > 0 && url.startsWith('/')) {
        url = url.substr(1);
    }
    const result = `${CONFIG.url}/${url}`;
    return result;
}

function displayHash() {
    var theHash = window.location.hash;
    if (theHash.length == 0) { theHash = "_index"; }
    var elems = document.querySelectorAll("#caption");
    elems[0].innerText = "Current Hash: " + theHash;
    return true;
}