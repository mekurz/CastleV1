function Logger()
{
  var div = $("#log");
  var dom = div[0];
  var MAX_LINES = 1000;
  var lines = 0;  
  
  this.add = function( str )
  {
    lines++;
    div.append( "<span>" + str + "<br/></span>" );
    
    this.trim_log();
    
    dom.scrollTop = dom.scrollHeight; 
  };
  
  this.debug = function( str )
  {
    if( DEBUGGING )
    {
      this.add( "<span style=\"color:blue;\">" + str + "</span>" );
    }
  };
  
  this.clear = function()
  {
    lines = 0;
    div.html( "" );
  };
  
  this.trim_log = function()
  {
    if( lines > MAX_LINES )
    {
      div.find("span").first().remove();
      lines = MAX_LINES;
    }
  };

}