# Make Liquid/Agar Media

Documentation here. Start with a paragraph, not a heading or title, as in most views, the title will be supplied by the view.




### Outputs


- **Media** [A]  
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "800 mL Agar")'>800 mL Agar</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "800 mL Liquid")'>800 mL Liquid</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "400 mL Agar")'>400 mL Agar</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "400 mL Liquid")'>400 mL Liquid</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "200 mL Agar")'>200 mL Agar</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "200 mL Liquid")'>200 mL Liquid</a>

### Precondition <a href='#' id='precondition'>[hide]</a>
```ruby
def precondition(op)
  true
end
```

### Protocol Code <a href='#' id='protocol'>[hide]</a>
```ruby
# frozen_string_literal: true

needs 'Reagents/MediaRecipe'

class Protocol

  def make_media_steps(bottle:, num_bottles:, multiplier:, ingredients:)
    show do
      title 'Gather the Following Items'
      check "#{num_bottles} #{bottle}(s)"
      ingredients.each do |reagent|
        check reagent.name
      end
    end

    if bottle.include?('1 L Bottle')
      show do
        title 'Add Stir Bar'
        check 'Retrieve 1 Medium Magnetic Stir Bar(s) from B1.525 or dishwashing station.'
        check 'Add the stir bar(s) to the bottle(s).'
      end
    end

    ingredients.each do |reagent|
      show do
        title "Add #{reagent}"
        note "Using the #{reagent.directions}, add <b>#{reagent.amount * multiplier}</b> #{reagent.unit} of <b>'#{reagent.name}'</b> into each bottle."
      end
    end
  end

  def label_media_steps(multiplier, label, number, mix_note = 'Shake until most of the powder is dissolved. It is ok if a small amount of powder is not dissolved because the autoclave will dissolve it', water_note = 'DI water carboy', label_note = '')
    show do
      title 'Measure Water'
      note "use the #{water_note} to add water up to the #{multiplier * 800} mL mark"
    end

    show do
      title 'Mix Solution'
      note mix_note.to_s
    end

    show do
      title 'Label Media'
      note "Label the bottle(s) with '#{label}', 'Your initials', 'date', and '#{number}'"
      note label_note.to_s
    end
  end

  def group_media(operations:)
    media_to_make = Hash.new
    operations.each do |op|
      item = op.output('Media').item
      sample_name = item.sample.name
      container = item.object_type.name

      key = "#{container} #{sample_name}"
      if media_to_make[key].nil?
        m = container.match(/(\d+)\s(\w+)\s(\w+)/)
        raise ProtocolError.new(message: 'Expect object type to indicate volume and Agar/Liquid') if m.nil?

        vol_str, unit, state = m.captures
        vol = vol_str.to_i
        bottle_volume = vol + vol / 4
        bottle = "#{bottle_volume == 1000.0 ? '1 L' : "#{bottle_volume} mL"} Bottle"
        media_to_make[key] = Media.new(sample_name: sample_name, volume: vol, unit: unit, type: state.downcase.to_sym, bottle: bottle, count: 0, output: [])
      end
      media_to_make[key].count += 1
      media_to_make[key].output.push(item.id)
    end
    media_to_make
  end

  def main
    operations.retrieve(interactive: false)
    operations.make

    dry_units = 'gram'
    dry_directions = 'gram scale, large weigh boat, and chemical spatula'
    wet_units = 'ml'
    wet_directions = 'serological pipette'

    media_to_make = group_media(operations: operations)
    media_to_make.each_value do |media|
      multiplier = media.volume / 800.0
      
      ingredients = []
      label = create_label(media: media)
      mix_note = 'Shake until most of the powder is dissolved. It is ok if a small amount of powder is not dissolved because the autoclave will dissolve it'
      water_note = 'DI water carboy'
      label_note = ''

      if media.sample_name.include?('SOB')
        ingredients.push(Ingredient.new(name: "Hanahan's Broth", amount: 22.4, unit: dry_units, directions: dry_directions))
        # change to bacteria media steps when Hanahan's broth is fixed
      elsif media.sample_name.include?('SOC')
          label += ' - Dextrose not added yet'
          ingredients.push(Ingredient.new(name: "Hanahan's Broth", amount: 22.4, unit: dry_units, directions: dry_directions))
          # change to bacteria media steps when Hanahan's broth is fixed

          show do
            title 'Add Dextrose'
            note "Once the autoclave is done, remove the SOC liquid without Dextrose and add #{7.2 * multiplier} mL of 40% Dextrose to the bottle"
          end

          show do
            title 'Relabel'
            note "Cross out the 'Dextrose not added'"
          end
      elsif media.sample_name.include?('TB')
        ingredients.push(Ingredient.new(name: 'Terrific Broth, modified', amount: 38.08, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: '50% Glycerol', amount: 12.8, unit: wet_units, directions: wet_directions))
      elsif media.sample_name.include?('LB')
        if media.type == :agar
          ingredients.push(Ingredient.new(name: 'LB Agar Miller', amount: 29.6, unit: dry_units, directions: dry_directions))
        else
          ingredients.push(Ingredient.new(name: 'Difco LB Broth, Miller', amount: 20, unit: dry_units, directions: dry_directions))
        end
      elsif media.sample_name.include?('10% Glycerol')
        ingredients.push(Ingredient.new(name: '50% Glycerol', amount: 160, unit: wet_units, directions: wet_directions))
      elsif media.sample_name.include?('YPAD')
        ingredients.push(Ingredient.new(name: 'Bacto Tryptone', amount: 16, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Bacto Yeast Extract', amount: 8, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Dextrose', amount: 16, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Adenine (Adenine hemisulfate)', amount: 0.064, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Bacto Agar', amount: 16, unit: dry_units, directions: dry_directions)) if media.type == :agar

        if media.sample_name.include?('Sorbitol')
          sorb_sample = Sample.find_by_name('Sorbitol Powder')
          sorb_item = sorb_sample.items.select { |i| i.deleted? && i.object_type.name == 'Bottle' }.first
          ingredients.push(Ingredient.new(name: "#{sorb_item} #{sorb_sample.name}", amount: 145.74, unit: dry_units, directions: dry_directions)) # grams of sorb (182.17g/mol) for 1M sorb in 800mL of media
        end
      elsif media.sample_name.include?('SC') || media.sample_name.include?('SDO')
        galactose = media.sample_name.include?('Gal')
        his = !media.sample_name.include?('-His')
        leu = !media.sample_name.include?('-Leu')
        ura = !media.sample_name.include?('-Ura')
        trp = !media.sample_name.include?('-Trp')

        ingredients.push(Ingredient.new(name: 'Yeast Nitrogen Base without Amino Acids', amount: 5.36, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Yeast Synthetic Drop-out Medium Supplements', amount: 1.12, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Dextrose', amount: galactose ? 1.6 : 16, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Galactose, 99%', amount: 16, unit: dry_units, directions: dry_directions)) if galactose
        ingredients.push(Ingredient.new(name: 'Adenine (Adenine hemisulfate)', amount: 0.064, unit: dry_units, directions: dry_directions))

        ingredients.push(Ingredient.new(name: 'Histidine Solution', amount: 8, unit: wet_units, directions: wet_directions)) if his
        ingredients.push(Ingredient.new(name: 'Leucine Solution', amount: 8, unit: wet_units, directions: wet_directions)) if leu
        ingredients.push(Ingredient.new(name: 'Uracil Solution', amount: 8, unit: wet_units, directions: wet_directions)) if ura
        ingredients.push(Ingredient.new(name: 'Tryptophan Solution', amount: 8, unit: wet_units, directions: wet_directions)) if trp
        ingredients.push(Ingredient.new(name: 'Bacto Agar', amount: 16, unit: dry_units, directions: dry_directions)) if media.type == :agar

      # Yeast Gates Alternative media
      elsif media.sample_name.include?('Synthetic Complete + 1M Sorbitol Media') || media.sample_name.include?('Synthetic Complete + 2% glycerol 2% ethanol Media')
        if media.sample_name.include?('2% ethanol')
          # do not add ethanol before autoclave
          label += ' -- no ethanol added'
        end

        # common ingredients
        dry_list = [['Yeast Nitrogen Base without Amino Acids', 5.36], ['Yeast Synthetic Drop-out Medium Supplements', 1.12], ['Adenine (Adenine hemisulfate)', 0.064]]
        liquids_list = [['Histidine Solution', 8], ['Leucine Solution', 8], ['Uracil Solution', 8], ['Tryptophan Solution', 8]]

        # Alternative ingredient compositions
        if media.sample_name.include?('Sorbitol')
          dry_list.append(['Dextrose', 16])
          dry_list.append(['Sorbitol', 145.7])
        end

        if media.sample_name.include?('2% glycerol') 
          liquids_list.append(['50% Glycerol', 32])
        end

        dry_list.each { |ing, amt| ingredients.push(Ingredient.new(name: ing, amount: amt, unit: dry_units, directions: dry_directions)) }
        liquids_list.each { |ing, amt| ingredients.push(Ingredient.new(name: ing, amount: amt, unit: wet_units, directions: wet_directions)) }
      elsif media.sample_name.include?('YPAD + 1M Sorbitol')

      elsif media.sample_name.include?('M9 + Glucose')
        ingredients.push(Ingredient.new(name: 'DI Water, Sterile', amount: 500, unit: wet_units, directions: 'autoclaved, large graduated cylinder'))
        ingredients.push(Ingredient.new(name: 'CaCl2, 1M', amount: 80, unit: 'uL', directions: 'P100 pipette')) 
        ingredients.push(Ingredient.new(name: 'MgSO4, 1M', amount: 1.6, unit: wet_units, directions: 'serological or P1000 pipette'))
        ingredients.push(Ingredient.new(name: 'Thiamine Hydrochloride solution (34g/L)', amount: 8, unit: wet_units, directions: wet_directions))
        ingredients.push(Ingredient.new(name: '10% Casamino Acids', amount: 16, unit: wet_units, directions: wet_directions))
        ingredients.push(Ingredient.new(name: '20% D-Glucose', amount: 16, unit: wet_units, directions: wet_directions))
        ingredients.push(Ingredient.new(name: '5x M9 salts', amount: 160, unit: wet_units, directions: wet_directions))

        mix_note = 'Shake the bottle(s) to mix the solution.'
        water_note = 'sterile DI Water'
        label_note = 'M9-glucose is not autoclaved. store it in the Deli Fridge.'
      elsif media.sample_name.include?('5x M9 salts')
        ingredients.push(Ingredient.new(name: 'DI water', amount: 600, unit: wet_units, directions: 'DI water carboy'))
        ingredients.push(Ingredient.new(name: 'Sodium Phosphate, Dibasic', amount: 27.12, unit: dry_units, directions: dry_directions)) # #{"Sodium Phosphate, Dibasic"}
        ingredients.push(Ingredient.new(name: 'Potassium Phosphate, Monobasic', amount: 12, unit: dry_units, directions: dry_directions)) # {"Potassium Phosphate, Monobasic"}
        ingredients.push(Ingredient.new(name: 'Sodium Chloride', amount: 2.0, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Ammonium Chloride', amount: 4.0, unit: dry_units, directions: dry_directions))

        mix_note = "stir with magnetic stirrer until dissolved.\nThis solution is sterilized by autoclaving."
      elsif media.sample_name.include?('Casamino Acids 10%')
        ingredients.push(Ingredient.new(name: 'Bacto Casamino Acids', amount: 80.0, unit: dry_units, directions: dry_directions))

        mix_note = 'stir with magnetic stirrer until dissolved.'
      end

      make_media_steps(bottle: media.bottle, num_bottles: media.count, multiplier: multiplier, ingredients: ingredients) 
      label_media_steps(multiplier, label, media.output, mix_note, water_note, label_note)
    end
  end

  def create_label(media:)
    if media.sample_name.include?('SOB')
      "SOB #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('SOC')
      "SOC #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('TB')
      "TB #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('LB')
      "LB #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('YPAD')
      if media.sample_name.include?('Sorbitol')
        "YPAD + 1M Sorb #{media.type.to_s.capitalize}"
      else
        "YPAD #{media.type.to_s.capitalize}"
      end
    elsif media.sample_name.include?('SC') 
      "SC #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('SDO') 
      label = 'SDO'
      label += ' +Gal' if media.sample_name.include?('Gal')
      label += ' -His' unless media.sample_name.include?('-His')
      label += ' -Leu' unless media.sample_name.include?('-Leu')
      label += ' -Ura' unless media.sample_name.include?('-Ura')
      label += ' -Trp' unless media.sample_name.include?('-Trp')
      "#{label} #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('Synthetic Complete + 1M Sorbitol Media')
      "SC + 1M Sorbitol #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('Synthetic Complete + 2% glycerol 2% ethanol Media')
      "SC + 2% glycerol 2% EtOH #{media.type.to_s.capitalize}"
    elsif media.sample_name.include?('M9 + Glucose')
      'M9-glucose'
    elsif media.sample_name.include?('5x M9 salts')
      '5x M9 salts'
    elsif media.sample_name.include?('Casamino Acids 10%')
      'Casamino acids 10%'
    end
  end
end


```
