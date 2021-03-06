---
layout: post
title: "Så värnar du om open source projekt"
created: 1248112748
---
Vi använder alla open source idag och vi påverkas alla av vilken riktning utvecklingen av ett open source projekt tar.

Ibland sker drastiska ändringar som gör oss upprörda, ibland sker en sakta vridning av ett projekt från något vi gillade till något vi inte är så förtjusta i.

Hur ser man till att de projekt man värnar om mest håller sig på banan och istället för att utvecklas bort från det man vill ha än mer fokuserar sig på det som man själv ser som projektets kärnvärden? Det finns några alternativ:

### Plötslig drastisk enskild händelse

Vid en plötslig drastisk enskild händelse av inte allt för stora proportioner gäller det att, helst proaktivt men även retroaktivt, göra sin röst hörd i den ticket/issue/bugg som diskuterar ämnet. Bäst är att hålla utkik i listorna och för att där upptäcka vad som håller på att ske - enklare kan vara att granska det genom att kontinuerligt granska kodbasen och beta-släpp eller om den trots det slipper igenom att upptäcka förändringen via den släppta produkten.

När väl förändringen är lokaliserad gäller det att samla på sig argument och lobba för varför den föreslagna förändringen inte är gynnsam för communityt i stort och försöka vinna över stöd för sin sak. Kan man dessutom få en kodare att understödja argumenten med faktiskt kod är det ett plus - men knappast ett krav. Open source världen i stort är en [do-ocracy](http://www.communitywiki.org/en/DoOcracy) så om det inte räcker att snacka för att få igenom en förändring, det kanske finns ett faktiskt problem som måste lösas med kod, så måste i slutändan kod skapas - men det är långt ifrån alltid där som skon klämmer, snarare att de kodare som redan finns inte får tillräckligt med feedback för att kunna utnyttjas optimalt.

Exempel: I [Wordpress](http://wordpress.org/) 2.8 gjordes en mindre [buggfix](http://core.trac.wordpress.org/changeset/11410) för att undvika allt för stort spammande av pingtjänster såsom Twingly. Tanken var bra, men utförandet inte helt lyckat - alla pingningar kom in en timme efter de borde. Communityt hade inte hittat misstaget tidigare, men arbetar just nu på att [lösa problemet](http://core.trac.wordpress.org/ticket/6698) och jag har skickat in några patchar. [Svaret](http://core.trac.wordpress.org/ticket/6698#comment:43) på varför patcharna inte kräver trejde parts granskning från communityt är: "Re the workflow, that would be ideal, if we had more contributors." - i andra ord: Bättre att en dålig förändring slinker igenom än ingen förändring alls - enda sättet att fixa är att vara med och granska och komma med lösningar.

### Plötslig drastisk större händelse

Ibland tar plötsligt ett helt projekt en drastisk vändning - det är inte bara en enskild förändring utan snarare så att någon av nyckelpersonerna eller nyckelgrupperna bakom projektet valt att slå in projektet på en helt annan väg än du tycker det ska ta. Som alltid gäller det att såklart göra din röst hörd inom communityt - visa att detta inte är något du stödjer med välbyggda argument och bygg upp ett stöd för din sak.

Om du inte får gehör, vilket kanske kan vara svårt om det råkar vara en sluten grupp med en bestämd åsikt och du kanske först nu förstått poängen att vara engagerad i communityt och alltså är en relativ nykomling, så har du ändå alternativ. Du kan såklart fortsätta använda den gamla versionen för all framtid - kanske kommer det fortsättas byggas utökningar etc för den, men eftersom själva kärnan inte stöds av någon grupp kan det bli knivigt med ex. säkerheten i längden. Har man tur kan man dock med det moment som byggdes upp underlobbying för en förändring av ursprungsprojektet skapa en språngbräda till att knoppa av den nuvarande versionen till ett nytt sidoprojekt - att "forka" det.

Forkning är en av de mer spännande aspekter av open source - oavsett hur åt skogen ett projekt och dess ledning går så kan produkten alltid överleva om någon plockar upp stafettpinnen och springer vidare. Det är inte lätt och det är traditionellt sett något som kan ses med ganska onda ögon från det existerande communityt så i de flesta fall är det enbart en sista utväg - men som alltid är vetskapen att den finns där om den behövs det viktigaste - det finns alltid en lösning med open source - alltid.

Exempel: [activeCollab](http://www.activecollab.com/) levde som ett open source projekt när upphovsmannen bestämde sig för att nästa version skulle lanseras kommersiellt - det gillade inte delar av communityt som valde att bygga vidare på open source varianten under namnet [ProjectPier](http://www.projectpier.org/)
### Långsam större händelse

Det kan hända att ett projekt så sakteliga viker av från kursen. Kanske börjar community-medlemmarna tappa gnistan, gå vidare i livet eller helt enkelt gå i samma fotspår och göra saker av slentrian istället för av upptäckarlusta. Orsakerna kan vara många, men gemensamt är att du troligast först märker det när det är för sent. När projektet under några år så sakteliga svängt in på fel kurs och mer eller mindre självdött kan det krävas mycket för att rädda det när man väl märker det.

Bästa försvaret mot långsamma större förändringar är att hålla sig aktiv i communityt - snappa upp signaler om förändringar, själv vara med och blanda sig och peppa och styra in det på rätt bana - både för att förhindra att projektet glider in på fel bana, men också för att tidigt se varningstecknena och kunna agera - antingen på ett personligt plan, genom att försöka söka andra alternativ, eller genom att pusha projektet hårdare i rätt riktning och se till att uppmärksamma andra på vad som kommer att ske.

Det finns precis här som med de plötsliga större händelser en möjlighet att forka - problemet kan vara att engagemanget redan nått en så låg nivå att det inte finns några människor att samla. Ett alternativ kan vara om projektet håller på att dö att man kan lyckas få ta över tronen (commit access) på det existerande projektet, men det kan också vara så att de desillusionerade ledarna inte vill lämna ifrån sig projektet av olika psykologiska anledningar och då är enda alternativet att dö med projektet eller att ta sig orken att flytta till ett annat - något som andra kanske redan gjort och som det kan finnas hjälp att få i att göra.

Exempel: [MySQL](http://mysql.com/) kan eventuellt ses som ett exempel - det har länge gått utför och många kärnutvecklare har hoppat både när de köptes upp av Sun och tros nå en kulmen nu med Suns uppköp av Oracle. Resultatet är forkar såsom [Drizzle](https://launchpad.net/drizzle) och [MariaDB](http://askmonty.org/wiki/index.php/MariaDB) som antingen kan ses som ett sista försök att rädda ett dött projekt eller som kanske fruktlösa försök att bryta med ett kanske fortfarande starkt projekt - eller så ser vi en framtid där lever jämnstarka sida vid sida - vi får se.

### Open source är du

Vi är vana vid att kunna peka finger när något går fel - säga att någon är ansvarig och att någon gjort fel och att någon måste fixa. Det gäller inte i open source världen - visst kan vi peka fingrar och säga att någon är ansvarig, gjort fel eller måste fixa något - men ytterst måste vi då också peka finger på oss själva och fundera på om inte vi har oss själva att skylla för att vi inte var där och åtgärdade den fixen.

Vi kan såklart inte alla fixa allt - men vi kan heller inte ha rätt att klaga på de som faktiskt försökt föra projektet framåt om inte vi själva försökt göra bättre. Open source handlar inte om att hitta fel som andra gjort utan om att hitta sätt att göra det bättre - och att göra det. Open source ÄR do-ocracy - det som görs bli gjort - det som klagas på blir som bäst bara klagat på och som värst en släckt mindre community när folk tröttnat lyssna på otacksamhet kring deras frivilliga insatser.

Det bästa du kan göra för att garantera att de projekt du gillar hålls hälsosamma är att bidra med dig själv - se till att färga de tankar som flyter i communityt och du kan om du ha tur inte bara få ett hälsosamt projekt utan tom ett blommande projekt. Alla kan vi göra något - alla bör vi göra något.
