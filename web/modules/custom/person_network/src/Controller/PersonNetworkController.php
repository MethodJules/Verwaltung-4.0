<?php

namespace Drupal\person_network\Controller;

use Drupal\Core\Controller\ControllerBase;

class PersonNetworkController extends ControllerBase {
    public function content() {
        $query = \Drupal::entityQuery('node')
                ->condition('type', 'person');
        $nids = $query->execute();
        $node_storage = \Drupal::entityTypeManager()->getStorage('node');

        $nodes = $node_storage->loadMultiple($nids);

        $index = 0;
        foreach($nodes as $node) {
            $graphdata['nodes'][] = ['name' => $node->title->value, 'type' => 'person'];
            $personIndex = $node->id();
            foreach ($node->field_projekt as $reference){
                //$projects[] = $reference->target_id;
                //s$projects[] = $reference->entity->title->value;
                    $graphdata['nodes'][] = ['name' => $reference->entity->title->value, 'type' => 'project'];
                    $projectIndex = $reference->target_id;
                    $graphdata['edges'][] = [
                        //'source' => $personIndex,
                        //'target' => $projectIndex];
                        'source' => array_search($node->title->value, array_column($graphdata['nodes'], 'name')),
                        'target' => array_search($reference->entity->title->value, array_column($graphdata['nodes'], 'name'))
                    ];
                    $graphdata['praedikate'][] = 'arbeitet an';
            }
        }
        //dsm($persons);

        //dsm($projects);
        //dsm($graphdata);

        $render_html = ['#markup' => '<h1>Person-Network</h1><div id="person_network_graphic"></div>'];
        $render_html['#attached']['library'][] = 'person_network/person_network_graphic';
        //$render_html['#attached']['drupalSettings']['baseUrl'] = $base_url;
        $render_html['#attached']['drupalSettings']['person_network']['graphdata'] = $graphdata;

        //return ['#markup' => 'Content Person Network'];
        return $render_html;
    }
}