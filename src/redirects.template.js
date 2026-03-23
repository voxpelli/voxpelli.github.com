import { escapeXml } from './lib/escape.js';

const redirects = [
  { from: '2008/12/ny blogg', to: '/2008/12/ny-blogg/' },
  { from: '2009/01/backchannels och googlebuggar', to: '/2009/01/backchannels-och-googlebuggar/' },
  { from: '2009/01/pingback multiping och global redirect', to: '/2009/01/pingback-multiping-och-global-redirect/' },
  { from: '2009/02/norsk ie 6 revolt inledd jippie', to: '/2009/02/norsk-ie-6-revolt-inledd-jippie/' },
  { from: '2009/05/presentationer konferenser och meetups', to: '/2009/05/presentationer-konferenser-och-meetups/' },
  { from: '2009/07/sa varnar du om open source projekt', to: '/2009/07/s-vrnar-du-om-open-source-projekt/' },
  { from: '2010/07/fika som pa gymmet med fastpris', to: '/2010/07/fika-som-p-gymmet-med-fastpris/' },
  { from: '2010/09/du rostar inte bara pa valdagen', to: '/2010/09/du-rstar-inte-bara-p-valdagen/' },
  { from: '2010/10/iphone alarmen forvirrade nu i vintertider', to: '/2010/10/iphonealarmen-frvirrade-nu-i-vintertider/' },
  { from: '2010/10/iphonealarmen forvirrade nu i vintertider', to: '/2010/10/iphonealarmen-frvirrade-nu-i-vintertider/' },
  { from: '2010/10/satsa alltid med hela hjartat', to: '/2010/10/satsa-alltid-med-hela-hjrtat/' },
  { from: '2010/11/ubuntu cola en onodig rattvisemarkning', to: '/2010/11/ubuntu-cola-en-ondig-rttvisemrkning/' },
  { from: '2011/03/sista dagen pa good old', to: '/2011/03/sista-dagen-p-good-old/' },
];

/**
 * Generate redirect pages for legacy URLs with spaces.
 *
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function redirectsTemplate () {
  return redirects.map(({ from, to }) => ({
    outputName: `${from}/index.html`,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${escapeXml(to)}" />
  <link rel="canonical" href="${escapeXml(to)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeXml(to)}">${escapeXml(to)}</a></p>
</body>
</html>`,
  }));
}
