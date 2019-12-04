var config = {

  tagline: "The Laboratory</br>Operating System",
  documentation_url: "http://localhost:4000/aquarium",
  title: "Liquid/Agar Media Workflow",
  navigation: [

    {
      category: "Overview",
      contents: [
        { name: "Introduction", type: "local-md", path: "README.md" },
        { name: "About this Workflow", type: "local-md", path: "ABOUT.md" },
        { name: "License", type: "local-md", path: "LICENSE.md" },
        { name: "Issues", type: "external-link", path: 'https://github.com/klavinslab/media-workflow/issues' }
      ]
    },

    

      {

        category: "Operation Types",

        contents: [

          
            {
              name: 'Make Liquid/Agar Media',
              path: 'operation_types/Make_Liquid_Agar_Media' + '.md',
              type: "local-md"
            },
          

        ]

      },

    

    

      {

        category: "Libraries",

        contents: [

          
            {
              name: 'MediaRecipe',
              path: 'libraries/MediaRecipe' + '.html',
              type: "local-webpage"
            },
          

        ]

    },

    

    
      { category: "Sample Types",
        contents: [
          
            {
              name: 'Media',
              path: 'sample_types/Media'  + '.md',
              type: "local-md"
            },
          
        ]
      },
      { category: "Containers",
        contents: [
          
            {
              name: '200 mL Agar',
              path: 'object_types/200_mL_Agar'  + '.md',
              type: "local-md"
            },
          
            {
              name: '200 mL Liquid',
              path: 'object_types/200_mL_Liquid'  + '.md',
              type: "local-md"
            },
          
            {
              name: '400 mL Agar',
              path: 'object_types/400_mL_Agar'  + '.md',
              type: "local-md"
            },
          
            {
              name: '400 mL Liquid',
              path: 'object_types/400_mL_Liquid'  + '.md',
              type: "local-md"
            },
          
            {
              name: '800 mL Agar',
              path: 'object_types/800_mL_Agar'  + '.md',
              type: "local-md"
            },
          
            {
              name: '800 mL Liquid',
              path: 'object_types/800_mL_Liquid'  + '.md',
              type: "local-md"
            },
          
        ]
      }
    

  ]

};
