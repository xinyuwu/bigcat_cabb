import { Folder, TextSnippet } from "@mui/icons-material";
import { ListItem, Box, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import * as React from "react";


export default function FileBrowser (
  props: {
    paths: any[],
    setSelectedItem: (selectedItem: any) => void
}) {
  const [path, setPath] = React.useState<any[]>(props.paths);
  const [selections, setSelections] = React.useState<string[]>([]);

  React.useEffect(() => {
    setPath(props.paths);
  }, [props.paths]);

  const handleSelection = (path: string[], selection: any) => {
    const newSelections = [...path];
    newSelections.push(selection['name']);
    setSelections(newSelections);

    const selectedItem = {
      path: path,
      name: selection['name'],
      is_directory: selection['is_directory'],
      children: selection['children']
    }
    props.setSelectedItem(selectedItem);
  }

  /**
   * @param pwd The current path location
   * @param path The path to render
   * @param isDir Weather that item is a directory or not
   * @param childrens If this item is a directory, it's childs.
   */
  const renderItem = (
    currentPath: string[],
    children: any[],
    selection: string
  ) => (
    <Box key={currentPath.length > 0 ? currentPath.join('/') : 'root'}
    sx={{
      minWidth: '20%',
      border: '1px solid #eeeeee',
      padding: '10px',
      overflow: 'scroll'
    }} >
      {
        children.map((child: any) => (
          ( child['is_directory']) 
          ?
          <ListItem
            key={currentPath.join('/') + '/' + child['name']}
            dense={true}
            onClick={() => handleSelection(currentPath, child)}
            sx={{
              borderRadius: '5px',
              padding: '1px',
              backgroundColor: child['name'] === selection ? '#bbdefb' : '',
              "&:hover": { cursor: 'pointer' }
            }}
          >
            <Folder color='primary' /> 
            <Typography variant="subtitle1" sx={{marginLeft: '5px'}}>
              {child['name']}
            </Typography>
          </ListItem>
          :
          <ListItem
            key={child['name']}
            dense={true}
            onClick={() => handleSelection(currentPath, child)}
            sx={{
                borderRadius: '5px',
                padding: '1px',
                backgroundColor: child['name'] === selection ? '#bbdefb' : '',
                "&:hover": {cursor: 'pointer'}
              }}
          >
              <TextSnippet sx={{ color: '#9e9e9e'}}/> 
              <Typography variant="subtitle1" sx={{ marginLeft: '5px' }}>
                {child['name']}
              </Typography>
          </ListItem>
        ))
      }
    </Box>
  );

  const getPaths = (index: number) => {
    const paths = selections.slice(0, index);
    return paths;
  }

  const getChildren = (index: number) => {
    let current: any[] = path;

    for (let i=0; i<index; i++) {
      const selection = selections[i];
      for (let child of current) {
        if (child['is_directory']) {
          if (child['name'] === selection) {
            current = child['children'];
            break;
          }
        } else if (child['name'] === selection) {
          return null;
        }
      }
    }

    return current;
  }

  const boxes: any[] = [];
  let index = 0;
  while (true) {
    const selection = (selections.length > index) ? selections[index] : '';
    const children = getChildren(index);

    if (children) {
      const box = renderItem(getPaths(index), children, selection)
      boxes.push(box);
      index++;
    }

    if (!selection)
      break;
  }

  return (
    <Stack direction={'row'} sx={{ height: '100%'}} >
      {boxes}
    </Stack>
  );
}
