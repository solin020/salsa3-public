export const insertElements = {
    listen: `<listen/>`,
    'last-user-statement': `<last-user-statement/>`,
    'last-chatbot-statement': `<last-chatbot-statement/>`,
    context: `<context>key</context>`,
    goto: `<goto>type label to go to here</goto>`,
    retry: '<retry/>',
    branch: `<branch>
    <choice>
        <consult-llm>
        <chatml role='system'>Did the user say something  like yes or no? If they said yes, say "yes", if they said no, say "no", otherwise, say "other"</chatml>
        <chatml role='question'><listen/></chatml>
        </consult-llm>
    </choice>
    <match choices='yes'>
        <goto>user-said-yes</goto>
    </match>
    <match choices='no'>
        <goto>user-said-no</goto>
    </match>
    <say>I didn't understand your response, please say yes or no</say>
    <retry/>
    </branch>`,
    say:`<say> Write your statement here </say>`,
    goodbye:`<goodbye> Write your goodbye message here </goodbye>`,
    'consult-llm':`
    <consult-llm>
    <chatml role='system'>You are a chatbot assistant. Answer the following question:</chatml>
        <chatml role='question'>Type your question here</chatml>
    </consult-llm>
    `,
    run: '<run> Type python code here</run>',
    match: `<match choices='maybe'>
        <goto>user-said-maybe</goto>
    </match>`,
    'chatml-system':`<chatml role='system'>Type system prompt here</chatml>`,
    'chatml-question':`<chatml role='question'>Type question for the LLM here (or insert a "listen" elmement )</chatml>`,
    
    
}



export const dialogtree2html = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="html" indent="yes"/>
  <xsl:strip-space elements="*"/>
  <xsl:preserve-space elements="chatml say run"/>

  <!-- Template for elements: rename and transform attributes to child elements -->
  <xsl:template match="*">
    <xsl:element name="dt-{name()}">
      
      <!-- Convert attributes to child elements -->
      <xsl:for-each select="@*[name()!='data-paste-level' and name()!='id']">
        <xsl:element name="dt-{name()}">
          <xsl:attribute name="dt-attr"/>
          <xsl:value-of select="."/>
        </xsl:element>
      </xsl:for-each>
      
      <!-- Continue processing child nodes -->
      <xsl:apply-templates select="node()"/>
      
    </xsl:element>
  </xsl:template>

  <!-- Template for all other nodes (text, comments, etc.) -->
  <xsl:template match="@*|text()|comment()|processing-instruction()">
    <xsl:copy/>
  </xsl:template>

</xsl:stylesheet>
`


export const html2dialogtree = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

  <xsl:output method="xml" indent="yes"/>

  <!-- Template for elements: rename and transform attributes to child elements -->
  <xsl:template match="*[not(@dt-attr)]">
    <xsl:element name="{substring(name(), 4)}">
        <xsl:apply-templates select="@id"/>
        <xsl:apply-templates select="@data-paste-level"/>
        <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>
  <xsl:template match="*[@dt-attr]">
    <xsl:attribute name="{substring(name(), 4)}">
        <xsl:value-of select="."/>
    </xsl:attribute>
  </xsl:template>

  <!-- Template for all other nodes (text, comments, etc.) -->
  <xsl:template match="@id|@data-paste-level|text()|comment()|processing-instruction()">
    <xsl:copy/>
  </xsl:template>

</xsl:stylesheet>`


export const pharm3 = `<?xml version="1.0" encoding="UTF-8"?>
<dialogtree id="n0"><say id="n1">Ask me any question.</say><branch id="n2" label="restart"><choice id="n4"><consult-llm id="n5"><chatml id="n6" role="system">Did the user ask a question or say they wanted to end the conversation? If what the user asked was a question, say 'question', otherwise, say 'end'. Do not actually answer the user's question. Answer with only one word. Do not say a sentence.</chatml><chatml id="n8" role="question"><listen id="n10"/></chatml></consult-llm></choice><match id="n11" choices="question"><goto id="n13">question</goto></match><match id="n14" choices="end"><goto id="n16">end</goto></match><goto id="n17">end</goto></branch><say id="n18" label="question"><consult-llm id="n20"><chatml id="n21" role="system">Answer the user's question.</chatml><chatml id="n23" role="question"><last-user-statement id="n25"/></chatml></consult-llm></say><say id="n26">Do you have any other questions for me?</say><goto id="n27">restart</goto><goodbye id="n28" label="end">Thanks for talking to me. I hope my answers were helpful to you.</goodbye></dialogtree>`