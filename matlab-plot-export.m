function glass_capture_plot(fig, destination)
  % Export bounded geometry; the original PNG remains available for exact styling.
  selected = [];
  for ax = findall(fig, 'type', 'axes')(:)'
    if (!any(strcmp(get(ax,'tag'), {'legend','colorbar'}))), selected(end+1) = ax; endif
  endfor
  if (numel(selected) != 1), return; endif
  ax = selected(1); traces = {}; count = 0;
  for child = flipud(get(ax,'children')(:))'
    if (strcmp(get(child,'visible'),'off')), continue; endif
    kind = get(child,'type');
    if (strcmp(kind,'hggroup') && isprop(child,'sizedata') && isprop(child,'zdata')), kind = 'scatter'; endif
    if (!any(strcmp(kind,{'surface','line','scatter'}))), return; endif
    x = get(child,'xdata'); y = get(child,'ydata'); z = get(child,'zdata');
    if (isempty(z) || !isreal(x) || !isreal(y) || !isreal(z)), return; endif
    count += numel(z); if (count > 50000 || numel(traces) >= 50), return; endif
    trace = struct('kind',kind,'x',x,'y',y,'z',z);
    if (strcmp(kind,'surface'))
      if (isvector(x) && isvector(y)), [x,y] = meshgrid(x(:)',y(:)); endif
      if (!isequal(size(x),size(z)) || !isequal(size(y),size(z))), return; endif
      trace.x = x; trace.y = y;
    else
      trace.x = x(:)'; trace.y = y(:)'; trace.z = z(:)';
      if (numel(x) != numel(z) || numel(y) != numel(z)), return; endif
      if (strcmp(kind,'line'))
        trace.color = get(child,'color'); trace.marker = !strcmp(get(child,'marker'),'none');
        trace.line = !strcmp(get(child,'linestyle'),'none');
      else
        trace.color = [0.15 0.4 0.7]; trace.marker = true; trace.line = false;
      endif
    endif
    traces{end+1} = trace;
  endfor
  if (isempty(traces)), return; endif
  scene = struct('version',1,'traces',{traces},'title',glass_plot_label(get(ax,'title')),'xlabel',glass_plot_label(get(ax,'xlabel')),'ylabel',glass_plot_label(get(ax,'ylabel')),'zlabel',glass_plot_label(get(ax,'zlabel')),'view',get(ax,'view'),'colormap',get(fig,'colormap'),'grid',{{strcmp(get(ax,'xgrid'),'on'),strcmp(get(ax,'ygrid'),'on'),strcmp(get(ax,'zgrid'),'on')}});
  encoded = jsonencode(scene); if (numel(encoded) > 2000000), return; endif
  file = fopen(destination,'w'); if (file < 0), return; endif
  unwind_protect
    fputs(file,encoded);
  unwind_protect_cleanup
    fclose(file);
  end_unwind_protect
endfunction
function text = glass_plot_label(handle)
  text = get(handle,'string'); if (iscell(text)), text = strjoin(text,' '); endif
  if (!ischar(text)), text = ''; endif
  text = text(1:min(numel(text),300));
endfunction
